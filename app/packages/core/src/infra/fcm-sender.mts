import { MessageSender } from "../usecase/message-sender.mjs";
import { App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { DeviceMessage } from "../entity/device-message.mjs";
import { NotificationResult, NotificationStatus } from "../entity/notification-result.mjs";
import logger from "./logger.mjs";

export class FcmSender implements MessageSender {
  private app: App;
  constructor(app: App) {
    this.app = app;
  }
  async sendToDevices(deviceMessages: DeviceMessage[]): Promise<NotificationResult[]> {
    logger.debug('fcm-sender', 'sendToDevices', 'メッセージ送信を開始します', {data: deviceMessages});
    const messaging = getMessaging(this.app);
    try {
      const responses = await messaging.sendEach(deviceMessages.map((deviceMessage) => {
        return {
          token: deviceMessage.device.getToken(),
          notification: {
            title: "今日のゴミ出し",
            body: deviceMessage.message
          }
        }
      }));
      return responses.responses.map((resp, index) => {
        if(!resp.success) {
          logger.error('fcm-sender', 'sendToDevices', 'メッセージの送信に失敗しました', {data: deviceMessages[index].device, error: resp.error});
          return {
            status: NotificationStatus.FAILURE,
            deviceToken: deviceMessages[index].device.getToken(),
            sendMessage:  deviceMessages[index].message,
            errorMessage: resp.error?.message || "不明なエラー"
          }
        } else {
          logger.debug('fcm-sender', 'sendToDevices', 'メッセージの送信に成功しました', {data: deviceMessages[index].device, messageId: resp.messageId});
          return {
            status: NotificationStatus.SUCCESS,
            deviceToken: deviceMessages[index].device.getToken(),
            sendMessage:  deviceMessages[index].message
          }
        }
      });
    } catch(e: any) {
      throw e;
    }
  }
}
