import { MessageSender } from "../usecase/message-sender.mjs";
import { App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { DeviceMessage } from "../entity/device-message.mjs";
import { NotificationResult, NotificationStatus } from "../entity/notification-result.mjs";

export class FcmSender implements MessageSender {
  private app: App;
  constructor(app: App) {
    this.app = app;
  }
  sendToDevices(deviceMessages: DeviceMessage[]): Promise<NotificationResult> {
    console.debug(deviceMessages);
    const messaging = getMessaging(this.app);
    return new Promise((resolve, reject) => {
      messaging.sendEach(deviceMessages.map((deviceMessage) => {
        return {
          token: deviceMessage.device.getToken(),
          notification: {
            title: "今日のゴミ出し",
            body: deviceMessage.message
          }
        }
      })).then((response) => {
        console.debug(response);
        if(response.failureCount === 0) {
          resolve( {
            status: NotificationStatus.SUCCESS,
            errorMessages: []
          });
        }
        const errorMessages: DeviceMessage[] = [];
        response.responses.forEach((resp, index) => {
          if(!resp.success) {
            console.error(`メッセージの送信に失敗しました - ${deviceMessages[index].device.getToken()}, メッセージID: ${resp.messageId}`)
            errorMessages.push(deviceMessages[index]);
          }
        });
        resolve({
          status: NotificationStatus.FAILURE,
          errorMessages: errorMessages
        });
      }).catch((e: any) => {
        console.error("メッセージの送信でエラーが発生しました");
        console.error(e.message || "不明なエラー")
        reject();
      });
    });
  }
}
