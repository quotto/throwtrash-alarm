import { MessageSender } from "./message-sender.mjs";
import { AlarmRepository} from "../usecase/alarm-repository.mjs";
import { TrashScheduleRepository } from "./trash-schedule-repository.mjs";
import { Alarm } from "../entity/alarm.mjs";
import { AlarmTime } from "../entity/alarm-time.mjs";
import { DeviceMessage } from "../entity/device-message.mjs";
import { DBAdapter, TextCreator, TrashSchedule, TrashScheduleService } from "trash-common";
import { NotificationStatus } from "../entity/notification-result.mjs";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { DeleteRequest } from "../data/delete-request.mjs";
import logger from "../infra/logger.mjs";

const MAX_SEND_DEVICES = 500;
class DBAdapterImple implements DBAdapter {
  getUserIDByAccessToken(access_token: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  getTrashSchedule(user_id: string): Promise<TrashSchedule> {
    throw new Error("Method not implemented.");
  }
}
const text_creator = new TextCreator("ja-JP");
const trash_schedule_service = new TrashScheduleService("Asia/Tokyo", text_creator,new DBAdapterImple());

export const sendMessage = async (
  trash_schedule_repository: TrashScheduleRepository,
  alarm_repository: AlarmRepository ,
  notification_sender: MessageSender,alarm_time: AlarmTime
) => {
  const target_alarms = await alarm_repository.listByAlarmTime(alarm_time);
  if(target_alarms.length == 0) {
    logger.warn('trigger-service', 'sendMessage', 'この時間に登録されているデバイスは見つかりませんでした', {data: alarm_time});
    return;
  }
  const all_send_tasks: Promise<any>[] = [];
  const updated_alarms: Alarm[] = [];

  // 500台ずつ送信する
  logger.info('trigger-service', 'sendMessage', `送信対象のデバイス数: ${target_alarms.length}`);
  while(target_alarms.length > 0) {
    const send_target_devices = target_alarms.splice(0, MAX_SEND_DEVICES);

    const device_messages: DeviceMessage[] = await getSendMessages(send_target_devices, trash_schedule_repository, trash_schedule_service);
    if(device_messages.length == 0) {
      const message = "デバイスに紐づくゴミ出し情報が1件も取得できませんでした";
      logger.error('trigger-service', 'sendMessage', message, {data: send_target_devices});
      throw new Error(message);
    }
    all_send_tasks.push(
      notification_sender.sendToDevices(device_messages).then((notification_results) => {
        notification_results.forEach(async (notification_result, index) => {
          if (notification_result.status === NotificationStatus.SUCCESS) {
            logger.debug('trigger-service', 'sendMessage', 'メッセージの送信に成功しました。', {data: send_target_devices[index].device, message: notification_result.sendMessage});
            updated_alarms.push(send_target_devices[index].success(new Date()));
          } else {
            logger.error('trigger-service', 'sendMessage', `メッセージの送信に失敗しました - ${notification_result.errorMessage || '不明なエラー'}`, {data: send_target_devices[index].device});
            updated_alarms.push(send_target_devices[index].failed(new Date()));
            await sendDeleteMessage(send_target_devices[index], new Date());
          }
        });
      }).catch((error) => {
        logger.error('trigger-service', 'sendMessage', error.message, {error: error});
      })
    );
  }

  await Promise.all(all_send_tasks);
  await alarm_repository.saveAll(updated_alarms);
}

const getSendMessages = async (alarms: Alarm[], trash_schedule_repository: TrashScheduleRepository, trash_schedule_service: TrashScheduleService): Promise<DeviceMessage[]> => {
  const device_messages: DeviceMessage[] = [];
    const tasks = alarms.map(async (alarm: Alarm)  => {
      return trash_schedule_repository.findTrashScheduleByUserId(alarm.user.getId()).then((trash_schedule) => {;
        if(trash_schedule == null) {
          logger.warn('trigger-service', 'getSendMessages', 'ユーザーIDに一致するゴミ出しスケジュールが見つかりませんでした', {data: alarm});
          return;
        }

        const today = trash_schedule_service.calculateLocalTime(0);
        const enable_trashes: string[] = [];
        trash_schedule!.trashData.forEach((trash_data) => {
          const trash_type = trash_schedule_service.getEnableTrashData(trash_data, today);
          if(trash_type) {
            enable_trashes.push(trash_type.name)
          }
        });
        const message = enable_trashes.length > 0 ? enable_trashes.join(",") : "今日出せるゴミはありません";

        device_messages.push(new DeviceMessage(alarm.device, message));
      }).catch((e)=>{
        console.error(`ゴミ出しスケジュールの取得でエラーが発生しました - ユーザーID: ${alarm.user.getId()}`);
        console.error(e.message || "不明なエラー");
        return;
      });
    });
    await Promise.all(tasks);
    return device_messages;
  }

const sendDeleteMessage = async (alarm: Alarm, newestFailedTime: Date) => {
  const sqsClient = new SQSClient({ region: "ap-northeast-1" });
  const queueUrl = process.env.ALARM_DELETE_QUEUE_URL;

  if (!queueUrl) {
    throw new Error("ALARM_DELETE_QUEUE_URLが設定されていません");
  }

  const messageBody: DeleteRequest = {
    alarm: {
      device_token: alarm.device.getToken(),
      alarm_time: alarm.alarmTime.formatTimeToHHMM(),
      user_id: alarm.user.getId(),
      platform: alarm.device.getPlatform(),
      created_at: alarm.alarmHistory.created_at.toISOString(),
      last_successful_time: alarm.alarmHistory.last_successful_time?.toISOString(),
      last_failed_time: alarm.alarmHistory.last_failed_time?.toISOString()
    },
    newest_failed_time: newestFailedTime.toISOString()
  }

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(messageBody)
  });

  try {
    await sqsClient.send(command);
    logger.debug('trigger-service', 'sendDeleteMessage', 'SQSメッセージを送信しました', {data: messageBody});
  } catch (error) {
    logger.error('trigger-service', 'sendDeleteMessage', 'SQSメッセージの送信に失敗しました', {error: error});
  }
}
