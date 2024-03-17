import { Device } from "@shared/core/domain/device.mjs";

export class DeviceMessage {
    constructor(
        public readonly device: Device,
        public readonly message: string,
    ){} 
}