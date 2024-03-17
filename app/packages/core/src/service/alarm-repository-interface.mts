import { Alarm, AlarmTime } from "../domain/alarm.mjs";

export interface AlarmRepositoryInterface {
    save: (alarm: Alarm) => Promise<boolean>;
    delete: (alarm: Alarm) => Promise<boolean>;
    findByDeviceToken: (deviceToken: string) => Promise<Alarm | null>;
    findByAlarmTime: (alarmTime: AlarmTime) => Promise<Alarm[]>;
}