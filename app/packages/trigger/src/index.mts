import 'source-map-support/register.js';
import { Callback, Context, EventBridgeEvent, EventBridgeHandler } from 'aws-lambda';
import * as admin from 'firebase-admin';
export const handler: EventBridgeHandler<string,string,void>  = async (event: EventBridgeEvent<string, string>, _context: Context, callback: Callback) => {
    console.log(event)

    // eventからalarm_timeを取得して合致するDynamoDBのアイテムを取得する
    // 取得したアイテムに格納されたdevice_tokenに対してFCMによるメッセージ送信を行う
    const alarmTime = JSON.parse(event.detail).alarm_time;
    // Retrieve the DynamoDB item that matches the alarm_time
    const item = await retrieveItemFromDynamoDB(alarmTime);
    if (item) {
        const deviceToken = item.device_token;
        // Send FCM message to the device_token
        await sendFCMMessage(deviceToken);
    }

    callback(null, "success");
}

const sendFCMMessage = async (deviceToken: string) => {
    // Initialize Firebase Admin SDK
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });

    // Create the message payload
    const message = {
        notification: {
            title: 'New Alarm',
            body: 'You have a new alarm!',
        },
        token: deviceToken,
    };

    // Send the FCM message
    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent FCM message:', response);
    } catch (error) {
        console.error('Error sending FCM message:', error);
    }
};

const retrieveItemFromDynamoDB = async (alarmTime: string) => {
    // Retrieve the DynamoDB item that matches the alarm_time
    // ...
    return {
        device_token: 'device_token'
    };
}