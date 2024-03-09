import 'source-map-support/register.js';
import { APIGatewayEvent,  APIGatewayProxyHandler, Context } from 'aws-lambda';
import { registerAlarm } from '../../libs/service/alarm-service.mjs';
import { AlarmRepository } from '../../libs/repository/alarm-repository.mjs';
import { AlarmTriggerConnector } from '../../libs/repository/alarm-trigger-connector.mjs';
import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { SchedulerClientConfig } from '@aws-sdk/client-scheduler';
import { ArgumentError } from '../../libs/domain/argument-error.mjs';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayEvent, _context: Context) => {
    try {
        const dynamoDBConfig: DynamoDBClientConfig = {
            region: 'ap-northeast-1'
        };
        const alarmRepository = new AlarmRepository(dynamoDBConfig, process.env.ALARM_TABLE_NAME!);

        const eventBridgeSchedulerClientConfig: SchedulerClientConfig = {
            region: 'ap-northeast-1',
        };
        const alarmTriggerConnector = new AlarmTriggerConnector({}, process.env.EVENT_BRIDGE_SCHEDULER_GROUP_NAME!);

        const params = event.body ? JSON.parse(event.body) : {};
        const { device_token, alarm_time, user_id, platform } = params;

        await registerAlarm(alarmRepository, alarmTriggerConnector, device_token, alarm_time, user_id, platform);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'アラームを設定しました。'
            }),
        };
    } catch (error: any) {
        if(error instanceof ArgumentError) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'アラームの設定に失敗しました。',
                    error: error.message || '不明なエラー',
                }),
            };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'アラームの設定に失敗しました。',
                error: error.message || '不明なエラー',
            }),
        };
    }
};