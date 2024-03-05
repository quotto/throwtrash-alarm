import { Alarm } from "../domain/alarm.mjs";
import { Device } from "../domain/device.mjs";
import { User } from "../domain/user.mjs";
import { AlarmRepositoryInterface } from "./alarm-repository-interface.mjs";
import { AlarmTriggerConnectorInterface } from "./alarm-trigger-connector-interface.mjs";

const registerAlarm = async (alarmRepository: AlarmRepositoryInterface, alarmTriggerConnector: AlarmTriggerConnectorInterface,deviceToken: string, time: string, userId: string, platform: string) => {
    const newAlarm = new Alarm(new Device(deviceToken, platform), time,new User(userId))
    if(await alarmTriggerConnector.findByTime(time) === null) {
        await alarmTriggerConnector.create(time);
        return await alarmRepository.create(newAlarm);
    }
    return false;
}

const updateAlarm = async (alarmRepository: AlarmRepositoryInterface, alarmTriggerConnector: AlarmTriggerConnectorInterface,deviceToken: string, time: string) => {
    const alarm = await alarmRepository.findByDeviceToken(deviceToken);
    if(alarm) {
        if(await alarmTriggerConnector.findByTime(time) === null) {
            await alarmTriggerConnector.create(time);
            return await alarmRepository.update(alarm);
        }
    }
    return false
}

const deleteAlarm = async (alarmRepository: AlarmRepositoryInterface, deviceToken: string) => {
    const alarm = await alarmRepository.findByDeviceToken(deviceToken);
    if(alarm) {
        return await alarmRepository.delete(alarm);
    }
}