import { describe, test, expect } from '@jest/globals';
import { Alarm, AlarmTime } from "../../../libs/domain/alarm.mjs";
import { ArgumentError } from "../../../libs/domain/argument-error.mjs";
import { Device } from "../../../libs/domain/device.mjs"
import { User } from "../../../libs/domain/user.mjs";

describe('Alarm', () => {
    test('正常にAlarmインスタンスが生成される', () => {
        const device = new Device('deviceToken', 'ios');
        const user = new User('userId');
        const alarm_time = new AlarmTime({hour: 12, minute:0});
        const alarm = new Alarm(device, alarm_time, user);
        expect(alarm.getDevice()).toEqual(device);
        expect(alarm.getAlarmTime()).toEqual(alarm_time);
        expect(alarm.getUser()).toEqual(user);
    });
});