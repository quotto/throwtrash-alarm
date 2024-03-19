import { Device } from "./device.mjs";

export class DeviceMessage {
    constructor(
        public readonly device: Device,
        public readonly message: string,
    ){}
}