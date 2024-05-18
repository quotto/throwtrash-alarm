import { jest, describe, test, expect } from '@jest/globals';
import { Alarm, AlarmTime } from "../../src/entity/alarm.mjs";
import { Device } from "../../src/entity/device.mjs";
import { User } from "../../src/entity/user.mjs";
import { AlarmHistory } from '../../src/entity/alarm-history.mjs';

describe('Alarm', () => {
    beforeEach(() => {
        const date_constructor = global.Date;
        global.Date = jest.fn(() => new date_constructor('2022-01-01T00:00:00Z')) as any;
    })
    describe('constructor', () => {
        test('AlarmHistoryの指定がない場合は現在時間でコンストラクタが生成される', () => {
            const device = new Device('deviceToken', 'ios');
            const user = new User('userId');
            const alarm_time = new AlarmTime({hour: 12, minute:0});
            const alarm = new Alarm(device, alarm_time, user);
            expect(alarm.device).toEqual(device);
            expect(alarm.alarmTime).toEqual(alarm_time);
            expect(alarm.user).toEqual(user);
            expect(alarm.alarmHistory.created_at.toISOString()).toEqual(new Date().toISOString());
        });
        test('AlarmHistoryのcreated_atが指定された場合はその時間でコンストラクタが生成される', () => {
            const device = new Device('deviceToken', 'ios');
            const user = new User('userId');
            const alarm_time = new AlarmTime({hour: 12, minute:0});
            const created_at = new Date('2021-01-01T00:00:00Z');
            const alarm = new Alarm(device, alarm_time, user, new AlarmHistory(created_at));
            expect(alarm.device).toEqual(device);
            expect(alarm.alarmTime).toEqual(alarm_time);
            expect(alarm.user).toEqual(user);
            expect(alarm.alarmHistory.created_at.toISOString()).toEqual(created_at.toISOString());
        });
        test('AlarmHistoryのlast_successful_time,last_failed_timeが指定された場合はその時間でコンストラクタが生成される', () => {
            const device = new Device('deviceToken', 'ios');
            const user = new User('userId');
            const alarm_time = new AlarmTime({hour: 12, minute:0});
            const created_at = new Date('2021-01-01T00:00:00Z');
            const last_successful_time = new Date('2021-01-01T00:00:00Z');
            const last_failed_time = new Date('2021-01-01T00:00:00Z');
            const alarm = new Alarm(device, alarm_time, user, new AlarmHistory(created_at, {last_successful_time, last_failed_time}));
            expect(alarm.device).toEqual(device);
            expect(alarm.alarmTime).toEqual(alarm_time);
            expect(alarm.user).toEqual(user);
            expect(alarm.alarmHistory.created_at.toISOString()).toEqual(created_at.toISOString());
            expect(alarm.alarmHistory.last_failed_time?.toISOString()).toEqual(last_successful_time.toISOString());
            expect(alarm.alarmHistory.last_failed_time?.toISOString()).toEqual(last_failed_time.toISOString());
        });
    });
    describe('updateAlarmTime', () => {
        test('AlarmTimeを更新した場合正常に更新ができ、他の要素は更新されないこと', () => {
            const device = new Device('deviceToken', 'ios');
            const user = new User('userId');
            const alarm_time = new AlarmTime({hour: 12, minute:0});
            const alarm = new Alarm(device, alarm_time, user);
            const new_alarm_time = new AlarmTime({hour: 13, minute:0});
            const updated_alarm = alarm.updateAlarmTime(new_alarm_time);
            expect(updated_alarm.device).toEqual(device);
            expect(updated_alarm.alarmTime).toEqual(new_alarm_time);
            expect(updated_alarm.user).toEqual(user);
            expect(updated_alarm.alarmHistory.created_at.toISOString()).toEqual('2022-01-01T00:00:00.000Z');
        });
    });
    describe('success', () => {
        test('AlarmHistoryの成功履歴を更新した場合正常に更新ができ、他の要素は更新されないこと', () => {
            const device = new Device('deviceToken', 'ios');
            const user = new User('userId');
            const alarm_time = new AlarmTime({hour: 12, minute:0});
            const alarm = new Alarm(device, alarm_time, user);
            const update_time = new Date('2023-01-01T00:00:00.000Z');
            const updated_alarm = alarm.success(update_time);
            alarm.success(update_time);
            expect(updated_alarm.device).toEqual(device);
            expect(updated_alarm.alarmTime).toEqual(alarm_time);
            expect(updated_alarm.user).toEqual(user);
            expect(updated_alarm.alarmHistory.last_successful_time?.toISOString()).toEqual(update_time.toISOString());
        });
    });
    describe('failed', () => {
        test('AlarmHistoryの失敗履歴を更新した場合正常に更新ができ、他の要素は更新されないこと', () => {
            const device = new Device('deviceToken', 'ios');
            const user = new User('userId');
            const alarm_time = new AlarmTime({hour: 12, minute:0});
            const alarm = new Alarm(device, alarm_time, user);
            const update_time = new Date('2023-01-01T00:00:00Z');
            const updated_alarm = alarm.failed(update_time);
            alarm.failed(update_time);
            expect(updated_alarm.device).toEqual(device);
            expect(updated_alarm.alarmTime).toEqual(alarm_time);
            expect(updated_alarm.user).toEqual(user);
            expect(updated_alarm.alarmHistory.last_failed_time?.toISOString()).toEqual(update_time.toISOString());
        });
    });
});