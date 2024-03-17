import { AlarmTime } from "@shared/core/domain/alarm-time.mjs";
import { MessageSender } from "./message-sender.mjs";
import { AlarmRepositoryInterface} from "@shared/core/service/alarm-repository-interface.mjs";
import { TrashScheduleRepository } from "./trash-schedule-repository.mjs";
import { Alarm } from "@shared/core/domain/alarm.mjs";
import { DBAdapter, TextCreator, TrashSchedule, TrashScheduleService } from "trash-common";
import { DeviceMessage } from "../entity/device-message.mjs";

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
  alarm_repository: AlarmRepositoryInterface ,
  notification_sender: MessageSender,alarm_time: string
) => {
  const target_devices = await alarm_repository.findByAlarmTime(new AlarmTime(alarm_time));  
  if(target_devices.length == 0) {
    console.warn("該当するデバイスはありませんでした");
    return;
  }
  target_devices.map(async (alarm: Alarm) => {
    const trash_schedule = await trash_schedule_repository.findTrashScheduleByUserId(alarm.getUser().getId());
    if(!trash_schedule) {
      console.warn(`ゴミ捨てスケジュールが見つかりませんでした - ${alarm.getUser().getId()}`);
      return;
    }
    const message = trash_schedule.trashData.map(async (trash_data) => {
      const trash_type = await trash_schedule_service.getEnableTrashData(trash_data, new Date())
      return trash_type ? trash_type.name : null;
    }).filter((trash_name) => trash_name !== null).join(",") || "今日出せるゴミはありません";
    return new DeviceMessage(alarm.getDevice(), message);
  })
}