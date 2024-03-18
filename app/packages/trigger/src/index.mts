import 'source-map-support/register.js';
import { Callback, Context, EventBridgeEvent, EventBridgeHandler } from 'aws-lambda';
import * as admin from 'firebase-admin';
import { FcmSender } from './infra/fcm-sender.mjs';
import { DynamoDBAlarmRepository } from '@shared/core/repository/dynamodb-alarm-repository.mjs';
import { DynamoDBTrashScheduleRepository } from './infra/dynamodb-trash-schedule-repository.mjs';
import { sendMessage } from './usecase/trigger-service.mjs';
import { AlarmTime } from '@shared/core/domain/alarm-time.mjs';

type RequestInput = {
    hour: number;
    minute: number;
}

export const handler: EventBridgeHandler<string,string,void>  = async (event: EventBridgeEvent<string, string>, _context: Context, callback: Callback) => {
    console.log(event)

    // 環境変数のチェック
    if(!process.env.ALARM_TABLE_NAME) {
        throw new Error("ALARM_TABLE_NAMEが設定されていません");
    }
    if(!process.env.TRASH_SCHEDULE_TABLE_NAME) {
        throw new Error("TRASH_SCHEDULE_TABLE_NAMEが設定されていません");
    }

    const alarm_time: RequestInput = JSON.parse(event.detail).alarm_time;

    const firebase_app = admin.initializeApp();
    const message_sender = new FcmSender(firebase_app);
    const alarm_repository = new DynamoDBAlarmRepository({},process.env.ALARM_TABLE_NAME);
    const trash_schedule_repository = new DynamoDBTrashScheduleRepository({},process.env.TRASH_SCHEDULE_TABLE_NAME);

    await sendMessage(trash_schedule_repository, alarm_repository, message_sender, new AlarmTime(alarm_time));

    callback(null, "success");
}