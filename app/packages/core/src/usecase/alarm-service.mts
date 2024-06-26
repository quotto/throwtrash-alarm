import { Alarm, AlarmTime } from "../entity/alarm.mjs";
import { Device } from "../entity/device.mjs";
import { User } from "../entity/user.mjs";
import { AlarmRepository } from "./alarm-repository.mjs";
import { AlarmScheduler } from "./alarm-scheduler.mjs";

export class RegisterError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RegisterError";
    }
}

export class UpdateError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UpdateError";
    }
}

export class DeleteError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DeleteError";
    }
}

export const registerAlarm = async (alarm_repository: AlarmRepository, alarm_trigger_connector: AlarmScheduler,deviceToken: string, alarm_time: AlarmTime, userId: string, platform: string) => {
    const new_alarm = new Alarm(new Device(deviceToken, platform), alarm_time,new User(userId))
    if(await alarm_trigger_connector.findByTime(new_alarm.alarmTime) === null) {
        if(!await alarm_trigger_connector.create(new_alarm.alarmTime)) {
            throw new RegisterError("アラームの作成に失敗しました");
        }
    }
    if(!await alarm_repository.save(new_alarm)) {
        throw new RegisterError("アラームの登録に失敗しました");
    }
}

export const updateAlarm = async (alarm_repository: AlarmRepository, alarm_trigger_connector: AlarmScheduler,device_token: string, alarm_time: AlarmTime) => {
    if(device_token === "") {
        throw new UpdateError("デバイストークンが指定されていません");
    }
    const alarm = await alarm_repository.findByDeviceToken(device_token);
    if(alarm) {
        const updatedAlarm = alarm.updateAlarmTime(alarm_time);
        if(await alarm_trigger_connector.findByTime(updatedAlarm.alarmTime) === null) {
            if(!await alarm_trigger_connector.create(updatedAlarm.alarmTime)) {
                throw new UpdateError("アラームトリガーの作成に失敗しました");
            }
        }
        if(!await alarm_repository.save(updatedAlarm)) {
            throw new UpdateError("アラームの更新に失敗しました");
        }
    } else {
        throw new UpdateError("登録済みのアラームが見つかりませんでした");
    }
}

export const deleteAlarm = async (alarm_repository: AlarmRepository, device_token: string) => {
    const alarm = await alarm_repository.findByDeviceToken(device_token);
    if(alarm != null) {
        if(!await alarm_repository.delete(alarm)) {
            throw new DeleteError("アラームの削除に失敗しました");
        }
    } else {
        throw new DeleteError("登録済みのアラームが見つかりませんでした");
    }

}