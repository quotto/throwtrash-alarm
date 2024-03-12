import { Device } from "./device.mjs";
import { User } from "./user.mjs";
import { AlarmTime } from "./alarm-time.mjs";

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

export { AlarmTime };
