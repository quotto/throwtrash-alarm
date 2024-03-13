import { Alarm } from "../domain/alarm.mjs";

export interface AlarmRepositoryInterface {
    create: (alarm: Alarm) => Promise<boolean>;
    update: (alarm: Alarm) => Promise<boolean>;
    delete: (alarm: Alarm) => Promise<boolean>;
    findByDeviceToken: (deviceToken: string) => Promise<Alarm | null>;
}