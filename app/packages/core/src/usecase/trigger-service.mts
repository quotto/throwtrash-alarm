import { MessageSender } from "./message-sender.mjs";
import { AlarmRepository} from "../usecase/alarm-repository.mjs";
import { TrashScheduleRepository } from "./trash-schedule-repository.mjs";
import { Alarm } from "../entity/alarm.mjs";
import { AlarmTime } from "../entity/alarm-time.mjs";
import { DeviceMessage } from "../entity/device-message.mjs";
import { DBAdapter, TextCreator, TrashSchedule, TrashScheduleService } from "trash-common";
import { NotificationStatus } from "../entity/notification-result.mjs";

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
    console.warn("この時間に登録されているデバイストークンは見つかりませんでした");
    return;
  }
  const all_send_tasks: Promise<any>[] = [];
  const updated_alarms: Alarm[] = [];

  // 500台ずつ送信する
  while(target_alarms.length > 0) {
    const send_target_devices = target_alarms.splice(0, MAX_SEND_DEVICES);

    const device_messages: DeviceMessage[] = await getSendMessages(send_target_devices, trash_schedule_repository, trash_schedule_service);
    console.log(device_messages.length);
    if(device_messages.length == 0) {
      const message = "ゴミ出し情報が1件も取得できませんでした";
      console.error(message);
      throw new Error(message);
    }
    all_send_tasks.push(
      notification_sender.sendToDevices(device_messages).then((notification_results) => {
        notification_results.forEach((notification_result, index) => {
          notification_result.status === NotificationStatus.SUCCESS ?
            updated_alarms.push(send_target_devices[index].success(new Date())) :
            updated_alarms.push(send_target_devices[index].failed(new Date()));
        });
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
          console.warn(`ユーザーIDに一致するゴミ出しスケジュールが見つかりませんでした - ユーザーID: ${alarm.user.getId()}`);
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
      });
    });
    await Promise.all(tasks);
    return device_messages;
  }