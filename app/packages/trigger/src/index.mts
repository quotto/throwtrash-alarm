import 'source-map-support/register.js';
import { Callback, Context, Handler } from 'aws-lambda';
import { FcmSender } from '@shared/core/infra/fcm-sender.mjs';
import { DynamoDBAlarmRepository } from '@shared/core/infra/dynamodb-alarm-repository.mjs';
import { DynamoDBTrashScheduleRepository } from '@shared/core/infra/dynamodb-trash-schedule-repository.mjs';
import { sendMessage } from '@shared/core/usecase/trigger-service.mjs';
import { AlarmTime } from '@shared/core/entity/alarm-time.mjs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';

type RequestInput = {
    hour: number;
    minute: number;
}

const firebase_app = initializeApp({credential: applicationDefault()});
export const handler: Handler  = async (event: any, _context: Context, callback: Callback) => {
    console.log(event)

    // 環境変数のチェック
    if(!process.env.ALARM_TABLE_NAME) {
        throw new Error("ALARM_TABLE_NAMEが設定されていません");
    }
    if(!process.env.TRASH_SCHEDULE_TABLE_NAME) {
        throw new Error("TRASH_SCHEDULE_TABLE_NAMEが設定されていません");
    }
    if(!process.env.SHARED_TRASH_SCHEDULE_TABLE_NAME) {
        throw new Error("TRASH_SCHEDULE_TABLE_NAMEが設定されていません");
    }

    const alarm_time: RequestInput = event.alarm_time;

    const message_sender = new FcmSender(firebase_app);
    const alarm_repository = new DynamoDBAlarmRepository({},process.env.ALARM_TABLE_NAME);
    const trash_schedule_repository = new DynamoDBTrashScheduleRepository({},process.env.TRASH_SCHEDULE_TABLE_NAME, process.env.SHARED_TRASH_SCHEDULE_TABLE_NAME);

    await sendMessage(trash_schedule_repository, alarm_repository, message_sender, new AlarmTime(alarm_time));

    callback(null, "success");
}