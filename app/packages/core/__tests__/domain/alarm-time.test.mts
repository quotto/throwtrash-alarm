import { describe, expect, test } from "@jest/globals";
import { AlarmTime } from "../../src/domain/alarm.mjs";
import { ArgumentError } from "../../src/domain/argument-error.mjs";

describe('AlarmTime', () => {
    describe('数値によるインスタンス生成', () => {
        test('正常にAlarmTimeインスタンスが生成される', () => {
            const alarm_time = new AlarmTime({hour: 12, minute:0});
            expect(alarm_time.getHour()).toBe(12);
            expect(alarm_time.getMinute()).toBe(0);
        });
        test('正常にAlarmインスタンスが生成される(午前境界値))', () => {
            let alarm_time = new AlarmTime({ hour: 0, minute: 0 });
            expect(alarm_time.getHour()).toEqual(0);
            expect(alarm_time.getMinute()).toEqual(0);

            alarm_time = new AlarmTime({ hour: 0, minute: 59 });
            expect(alarm_time.getHour()).toEqual(0);
            expect(alarm_time.getMinute()).toEqual(59);

            alarm_time = new AlarmTime({ hour: 11, minute: 59 });
            expect(alarm_time.getHour()).toEqual(11);
            expect(alarm_time.getMinute()).toEqual(59);
        });
        test('正常にAlarmインスタンスが生成される(午後境界値))', () => {
            let alarm_time = new AlarmTime({ hour: 12, minute: 0 });
            expect(alarm_time.getHour()).toEqual(12);
            expect(alarm_time.getMinute()).toEqual(0);

            alarm_time = new AlarmTime({ hour: 12, minute: 59 });
            expect(alarm_time.getHour()).toEqual(12);
            expect(alarm_time.getMinute()).toEqual(59);

            alarm_time = new AlarmTime({ hour: 23, minute: 59 });
            expect(alarm_time.getHour()).toEqual(23);
            expect(alarm_time.getMinute()).toEqual(59);
        });
        test('hourが24時以降の場合、エラーが発生する', () => {
            expect(() => new AlarmTime({ hour: 24, minute: 0 })).toThrow(ArgumentError);
        });
        test('minuteが60分以降の場合、エラーが発生する', () => {
            expect(() => new AlarmTime({ hour: 12, minute: 60 })).toThrow(ArgumentError);
        });
        test('NaNが渡された場合、エラーが発生する', () => {
            expect(() => new AlarmTime({ hour: NaN, minute: 0 })).toThrow(ArgumentError);
            expect(() => new AlarmTime({ hour: 0, minute: NaN })).toThrow(ArgumentError);
        });
    });
    describe('文字列によるインスタンス生成', () => {
        test('正常にAlarmTimeインスタンスが生成される', () => {
            const alarm_time = new AlarmTime('1200');
            expect(alarm_time.getHour()).toBe(12);
            expect(alarm_time.getMinute()).toBe(0);
        });
        test('hourが24時以降の場合、エラーが発生する', () => {
            expect(() => new AlarmTime('2400')).toThrow(ArgumentError);
        });
        test('minuteが60分以降の場合、エラーが発生する', () => {
            expect(()=>new AlarmTime('1260')).toThrow(ArgumentError);
        });
        test('文字列が4文字でない場合、エラーが発生する', () => {
            expect(()=>new AlarmTime('120')).toThrow(ArgumentError);
            expect(()=>new AlarmTime('12000')).toThrow(ArgumentError);
            expect(()=>new AlarmTime('')).toThrow(ArgumentError);
        });
        test('数字以外の文字列が渡された場合、エラーが発生する', () => {
            expect(()=>new AlarmTime('abcd')).toThrow(ArgumentError);
        });
    });
    describe('formatTimeToHHMM', () => {
        test('正常にフォーマットされる', () => {
            expect(new AlarmTime({hour: 12, minute: 0}).formatTimeToHHMM()).toBe('1200');
            expect(new AlarmTime({hour: 0, minute: 0}).formatTimeToHHMM()).toBe('0000');
            expect(new AlarmTime({hour: 0, minute: 59}).formatTimeToHHMM()).toBe('0059');
            expect(new AlarmTime({hour: 12, minute: 59}).formatTimeToHHMM()).toBe('1259');
            expect(new AlarmTime({hour: 23, minute: 59}).formatTimeToHHMM()).toBe('2359');
        });
    });
});