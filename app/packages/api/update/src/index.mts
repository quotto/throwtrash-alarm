import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { APIGatewayEvent, APIGatewayProxyHandler, Context } from 'aws-lambda';
import 'source-map-support/register.js'
import { SchedulerClientConfig } from '@aws-sdk/client-scheduler';
import { updateAlarm } from '@shared/core/usecase/alarm-service.mjs';
import { ArgumentError } from '@shared/core/entity/argument-error.mjs';
import { AlarmTime } from '@shared/core/entity/alarm-time.mjs';
import { DynamoDBAlarmRepository } from '@shared/core/infra/dynamodb-alarm-repository.mjs';
import { EventBridgeAlarmScheduler } from '@shared/core/infra/eventbridge-alarm-scheduler.mjs';

type RequestBody= {
    device_token: string;
    alarm_time: {
        hour: number;
        minute: number;
    };
}
export const handler: APIGatewayProxyHandler = async (event: APIGatewayEvent, _context: Context) => {
    try {
        const dynamodb_config: DynamoDBClientConfig = {
            region: 'ap-northeast-1'
        };
        const alarm_repository = new DynamoDBAlarmRepository(dynamodb_config, process.env.ALARM_TABLE_NAME!);

        const event_bridge_scheduler_client_config: SchedulerClientConfig = {
            region: 'ap-northeast-1',
        };
        const alarm_trigger_connector = new EventBridgeAlarmScheduler(event_bridge_scheduler_client_config, process.env.EVENT_BRIDGE_SCHEDULER_GROUP_NAME!, process.env.ALARM_TRIGGER_FUNCTION_ARN!, process.env.ALARM_TRIGGER_FUNCTION_ROLE_ARN!);

        const { device_token, alarm_time }: RequestBody = event.body ? JSON.parse(event.body) : {};

        await updateAlarm(
            alarm_repository,
            alarm_trigger_connector,
            device_token,
            new AlarmTime(alarm_time),
        );
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'アラームを更新しました。'
            }),
        };
    } catch (error: any) {
        if(error instanceof ArgumentError) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'アラームの更新に失敗しました。',
                    error: error.message || '不明なエラー',
                }),
            };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'アラームの更新に失敗しました。',
                error: error.message || '不明なエラー',
            }),
        };
    }
};