import { DeviceMessage } from "./device-message.mjs";

export enum NotificationStatus {
    SUCCESS,
    FAILURE
}

export type NotificationResult = {
    status: NotificationStatus;
    deviceToken: string;
    sendMessage: string;
    errorMessage?: string;
}