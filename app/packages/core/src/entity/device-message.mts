import { Device } from "./device.mjs";

export class DeviceMessage {
    constructor(
        public readonly device: Device,
        public readonly message: string,
        public readonly title: string = "今日のゴミ出し",
    ){}
}
