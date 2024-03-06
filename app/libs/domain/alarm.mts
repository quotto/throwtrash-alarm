import { Device } from "./device.mjs";
import { User } from "./user.mjs";
import { ArgumentError } from "./argument-error.mjs"

export class Alarm {
    private device: Device;
    private time: string;
    private user: User;
    constructor(device: Device, time: string, user: User) {
        // timeのフォーマットはHHMM形式かつ妥当な時間であること
        if (!/^(0[0-9]|1[0-9]|2[0-3])[0-5][0-9]$/.test(time)) {
            throw new ArgumentError('パラメータtimeはHHMM形式である必要があります');
        }
        this.time = time;
        this.device = device;
        this.user = user;
    }
    getDevice(): Device {
        return this.device;
    }
    getTime(): string {
        return this.time;
    }
    getUser(): User {
        return this.user;
    }

    updateTime(time: string): Alarm {
        return new Alarm(this.device, time, this.user);
    }
}