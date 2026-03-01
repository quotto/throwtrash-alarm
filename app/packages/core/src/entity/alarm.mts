import { Device } from "./device.mjs";
import { User } from "./user.mjs";
import { AlarmTime } from "./alarm-time.mjs";
import { AlarmHistory } from "./alarm-history.mjs";

export class Alarm {
    private _device: Device;
    private _alarm_time: AlarmTime;
    private _user: User;
    private _next_day_notification_enabled: boolean;
    private _alarm_history: AlarmHistory;
    constructor(device: Device, alarm_time: AlarmTime, user: User, next_day_notification_enabled?: boolean, alarm_history?: AlarmHistory) {
        this._alarm_time = alarm_time;
        this._device = device;
        this._user = user;
        this._next_day_notification_enabled = next_day_notification_enabled ?? false;
        if(!alarm_history) {
            this._alarm_history = new AlarmHistory(new Date());
        } else {
            this._alarm_history = alarm_history;
        }
    }
    get device(): Device {
        return this._device;
    }
    get alarmTime(): AlarmTime {
        return this._alarm_time;
    }
    get user(): User {
        return this._user;
    }
    get nextDayNotificationEnabled(): boolean {
        return this._next_day_notification_enabled;
    }
    updateAlarmTime(alarm_time: AlarmTime): Alarm {
        return new Alarm(this._device, alarm_time, this._user, this._next_day_notification_enabled, this._alarm_history);
    }
    updateNextDayNotificationEnabled(next_day_notification_enabled: boolean): Alarm {
        return new Alarm(this._device, this._alarm_time, this._user, next_day_notification_enabled, this._alarm_history);
    }
    success(update_time: Date): Alarm {
        const new_alarm_history = this._alarm_history.updateLastSuccessfulTime(update_time);
        return new Alarm(this._device, this._alarm_time, this._user, this._next_day_notification_enabled, new_alarm_history);
    }
    failed(update_time: Date): Alarm {
        const new_alarm_history = this._alarm_history.updateLastFailedTime(update_time);
        return new Alarm(this._device, this._alarm_time, this._user, this._next_day_notification_enabled, new_alarm_history);
    }

    get alarmHistory(): AlarmHistory {
        return this._alarm_history;
    }
}

export { AlarmTime };
