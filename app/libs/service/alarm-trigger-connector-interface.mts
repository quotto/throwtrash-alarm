import { AlarmTime } from "../domain/alarm.mjs";

export interface AlarmTriggerConnectorInterface {
    create(alarm_time: AlarmTime): Promise<boolean>;
    findByTime(alarm_time: AlarmTime): Promise<string | null>;
}