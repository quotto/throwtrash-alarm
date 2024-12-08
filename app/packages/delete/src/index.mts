import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { SQSEvent, SQSHandler, Context } from 'aws-lambda';
import 'source-map-support/register.js'
import { deleteAlarmsFailedForOver30Days } from '@shared/core/usecase/alarm-service.mjs';
import { ArgumentError } from '@shared/core/entity/argument-error.mjs';
import { DynamoDBAlarmRepository } from '@shared/core/infra/dynamodb-alarm-repository.mjs';

export const handler: SQSHandler = async (event: SQSEvent, _context: Context) => {
    try {
        const dynamoDBConfig: DynamoDBClientConfig = {
            region: 'ap-northeast-1'
        };
        const alarmRepository = new DynamoDBAlarmRepository(dynamoDBConfig, process.env.ALARM_TABLE_NAME!);

        for (const record of event.Records) {
            const { newest_failed_time } = JSON.parse(record.body);
            const newestFailedTime = new Date(newest_failed_time);

            await deleteAlarmsFailedForOver30Days(alarmRepository, newestFailedTime);
        }
    } catch (error: any) {
        if(error instanceof ArgumentError) {
            console.error('アラームの削除に失敗しました。', error.message || '不明なエラーが発生しました');
        } else {
            console.error('アラームの削除に失敗しました。', error.message || '不明なエラーが発生しました');
        }
    }
};
