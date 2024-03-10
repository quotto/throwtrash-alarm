import { Device } from "./device.mjs";
import { User } from "./user.mjs";
import { ArgumentError } from "./argument-error.mjs"

export type NumericTime = {
    hour: number;
    minute: number;
}
export class AlarmTime {
    private hour: number
    private minute: number
    constructor(alarm_time: NumericTime | string) {
        // alarm_timeが文字列の場合に初期化処理が無いとエラーになるため初期化する
        this.hour = 0
        this.minute = 0
        if (typeof alarm_time === 'string') {
            // HHMM形式の文字列を数値に変換
            // 4文字でない場合はエラー
            if (alarm_time.length !== 4) {
                throw new ArgumentError("アラームの時間が不正です");
            }
            try {
                const hour = parseInt(alarm_time.slice(0, 2));
                const minute = parseInt(alarm_time.slice(2, 4));
                return new AlarmTime({ hour: hour, minute: minute });
            } catch (e: any) {
                console.error(e.message)
                throw new ArgumentError("アラームの時間が不正です");
            }
        } else {
            // hourとminuteが0以上23以下、0以上59以下であるかを確認
            if ((alarm_time.hour < 0 || alarm_time.hour > 23) ||
                (alarm_time.minute < 0 || alarm_time.minute > 59) || 
                Number.isNaN(alarm_time.hour) || Number.isNaN(alarm_time.minute)) {
                throw new ArgumentError("アラームの時間が不正です");
            }
            this.hour = alarm_time.hour;
            this.minute = alarm_time.minute;
        }
    }
    getHour(): number {
        return this.hour;
    }

    getMinute(): number {
        return this.minute;
    }
    formatTimeToHHMM(): string {
        // 1桁の値は0埋めしてHH:MM形式にする
        const hour = ('0' + this.hour).slice(-2);
        const minute = ('0' + this.minute).slice(-2);
        return `${hour}${minute}`;
    }
}
export class Alarm {
    private device: Device;
    private alarm_time: AlarmTime;
    private user: User;
    constructor(device: Device, alarm_time: AlarmTime, user: User) {
        this.alarm_time = alarm_time;
        this.device = device;
        this.user = user;
    }
    getDevice(): Device {
        return this.device;
    }
    getAlarmTime(): AlarmTime {
        return this.alarm_time;
    }
    getUser(): User {
        return this.user;
    }
    updateTime(alarm_time: AlarmTime): Alarm {
        return new Alarm(this.device, alarm_time, this.user);
    }
}