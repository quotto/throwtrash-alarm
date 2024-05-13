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
  sendToDevices(deviceMessages: DeviceMessage[]): Promise<NotificationResult[]> {
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
        const result = response.responses.map((resp, index) => {
          if(!resp.success) {
            console.error(`メッセージの送信に失敗しました - ${deviceMessages[index].device.getToken()}, メッセージID: ${resp.messageId}`)
            console.error(resp.error?.toJSON());
            return {
              status: NotificationStatus.FAILURE,
              deviceToken: deviceMessages[index].device.getToken(),
              sendMessage:  deviceMessages[index].message,
              errorMessage: resp.error?.message || "不明なエラー"
            }
          } else {
            return {
              status: NotificationStatus.SUCCESS,
              deviceToken: deviceMessages[index].device.getToken(),
              sendMessage:  deviceMessages[index].message
            }
          }
        });
        resolve(result);
      }).catch((e: any) => {
        console.error("メッセージの送信でエラーが発生しました");
        console.error(e.message || "不明なエラー")
        if(e instanceof Error) {
          console.error(e.stack);
        }
        reject(e);
      });
    });
  }
}
