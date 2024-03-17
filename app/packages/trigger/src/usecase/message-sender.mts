import { Device } from "@shared/core/domain/device.mjs";
import { DeviceMessage } from "../entity/device-message.mjs";
import { NotificationResult } from "../entity/notification-result.mjs";

export interface MessageSender {
    sendToDevices(deviceMessages: DeviceMessage[]): Promise<NotificationResult>;
}