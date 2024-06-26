import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { APIGatewayEvent, APIGatewayProxyHandler, Context } from 'aws-lambda';
import 'source-map-support/register.js'
import { deleteAlarm } from '@shared/core/usecase/alarm-service.mjs';
import { ArgumentError } from '@shared/core/entity/argument-error.mjs';
import { DynamoDBAlarmRepository } from '@shared/core/infra/dynamodb-alarm-repository.mjs';

type RequestBody= {
    device_token: string;
}
export const handler: APIGatewayProxyHandler = async (event: APIGatewayEvent, _context: Context) => {
    try {
        const dynamoDBConfig: DynamoDBClientConfig = {
            region: 'ap-northeast-1'
        };
        const alarmRepository = new DynamoDBAlarmRepository(dynamoDBConfig, process.env.ALARM_TABLE_NAME!);
        const params = event.body ? JSON.parse(event.body) : {};
        const { device_token }: RequestBody = params;

        await deleteAlarm(
            alarmRepository,
            device_token
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
                    error: error.message || '不明なエラーが発生しました',
                }),
            };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'アラームの更新に失敗しました。',
                error: error.message || '不明なエラーが発生しました',
            }),
        };
    }
};