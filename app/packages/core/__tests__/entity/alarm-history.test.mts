import { AlarmHistory } from '../../src/entity/alarm-history.mjs';
import { ArgumentError } from '../../src/entity/argument-error.mjs';

describe('AlarmHistory', () => {
    describe('constructor', () => {
        test('last_sucessful_time,last_failed_time無しで正常にインスタンス化できること', () => {
            const created_at = new Date();
            const alarm_history = new AlarmHistory(created_at);
            expect(alarm_history).toBeInstanceOf(AlarmHistory);
            expect(alarm_history.created_at).toEqual(created_at);
            expect(alarm_history.last_successful_time).toBeUndefined();
            expect(alarm_history.last_failed_time).toBeUndefined();
        });
        test('last_sucessful_time有りで正常にインスタンスができること', () => {
            const created_at = new Date();
            const last_sucessful_time = new Date();
            const alarm_history = new AlarmHistory(created_at, {last_successful_time: last_sucessful_time });
            expect(alarm_history).toBeInstanceOf(AlarmHistory);
            expect(alarm_history.created_at).toEqual(created_at);
            expect(alarm_history.last_successful_time).toEqual(last_sucessful_time);
            expect(alarm_history.last_failed_time).toBeUndefined();
        });
        test('last_failed_time有りで正常にインスタンスができること', () => {
            const created_at = new Date();
            const last_failed_time = new Date();
            const alarm_history = new AlarmHistory(created_at, { last_failed_time });
            expect(alarm_history).toBeInstanceOf(AlarmHistory);
            expect(alarm_history.created_at).toEqual(created_at);
            expect(alarm_history.last_successful_time).toBeUndefined();
            expect(alarm_history.last_failed_time).toEqual(last_failed_time);
        });
        test('last_successful_time,last_failed_time療法を指定して正常にインスタンスができること', () => {
            const created_at = new Date();
            const last_successful_time = new Date();
            const last_failed_time = new Date();
            const alarm_history = new AlarmHistory(created_at, { last_successful_time, last_failed_time });
            expect(alarm_history).toBeInstanceOf(AlarmHistory);
            expect(alarm_history.created_at).toEqual(created_at);
            expect(alarm_history.last_successful_time).toEqual(last_successful_time);
            expect(alarm_history.last_failed_time).toEqual(last_failed_time);
        })
        test('last_successful_timeがcreated_atより前の場合はエラーが発生すること', () => {
            const created_at = new Date();
            const last_successful_time = new Date(created_at.getTime() - 1);
            expect(() => new AlarmHistory(created_at, { last_successful_time })).toThrow(ArgumentError);
        });
        test('last_failed_timeがcreated_atより前の場合はエラーが発生すること', () => {
            const create_at = new Date();
            const last_failed_time = new Date(create_at.getTime() - 1);
            expect(() => new AlarmHistory(create_at, { last_failed_time })).toThrow(ArgumentError);
        });
        test('last_successful_timeの境界値チェック', () => {
            const created_at = new Date();
            const last_successful_time = new Date(created_at.getTime());
            const alarm_history = new AlarmHistory(created_at, { last_successful_time });
            expect(alarm_history.created_at).toEqual(created_at);
            expect(alarm_history.last_successful_time).toEqual(last_successful_time);
        });
        test('last_failed_timeの境界値チェック', () => {
            const created_at = new Date();
            const last_failed_time = new Date(created_at.getTime());
            const alarm_history = new AlarmHistory(created_at, { last_failed_time });
            expect(alarm_history.created_at).toEqual(created_at);
            expect(alarm_history.last_failed_time).toEqual(last_failed_time);
        });
    });
    describe('updateLastSuccessfulTime', () => {
        test('正常に更新され、created_at, last_failed_timeは更新されないこと', () => {
            const created_at = new Date();
            const last_successful_time = new Date();
            const alarm_history = new AlarmHistory(created_at, { last_successful_time });
            const new_last_successful_time = new Date(last_successful_time.getTime() + 100);
            const updated_alarm_history = alarm_history.updateLastSuccessfulTime(new_last_successful_time);
            expect(updated_alarm_history.last_successful_time).toEqual(new_last_successful_time);
            expect(updated_alarm_history.created_at).toEqual(created_at);
            expect(updated_alarm_history.last_failed_time).toEqual(alarm_history.last_failed_time);
        });
    });
    describe('updateLastFailedTime', () => {
        test('正常に更新され,created_at,last_successful_timeは更新されないこと', () => {
            const created_at = new Date();
            const last_failed_time = new Date();
            const alarm_history = new AlarmHistory(created_at, { last_failed_time });
            const new_last_failed_time = new Date(last_failed_time.getTime() + 100);
            const updated_alarm_history = alarm_history.updateLastFailedTime(new_last_failed_time);
            expect(updated_alarm_history.last_failed_time).toEqual(new_last_failed_time);
            expect(updated_alarm_history.created_at).toEqual(created_at);
            expect(updated_alarm_history.last_successful_time).toEqual(alarm_history.last_successful_time);
        });
    });
});