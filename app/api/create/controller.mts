import { APIGatewayEvent, APIGatewayEventRequestContext, APIGatewayProxyHandler, Context } from 'aws-lambda';
import 'source-map-support/register';
import { registerAlarm } from '../../libs/service/alarm-service.mjs';
import { AlarmRepository } from '../../libs/repository/alarm-repository.mjs';
import { AlarmTriggerConnector } from '../../libs/repository/alarm-trigger-connector.mjs';
import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { SchedulerClientConfig } from '@aws-sdk/client-scheduler';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayEvent, _context: Context) => {
    const params = event.body ? JSON.parse(event.body) : {};
    
    const dynamoDBConfig: DynamoDBClientConfig = {
        region: 'us-east-1'
    };
    const alarmRepository = new AlarmRepository(dynamoDBConfig);
    
    const eventBridgeSchedulerClientConfig: SchedulerClientConfig = {
        region: 'us-east-1',
        endpoint: 'http://localhost:8000'
    };
    const alarmTriggerConnector = new AlarmTriggerConnector({});
    const { device_token, alarm_time, user_id, platform } = params;
    try {
        await registerAlarm(alarmRepository, alarmTriggerConnector, device_token, alarm_time, user_id, platform);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Successfully registered'
            }),
        };
    } catch (error: any) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error registering',
                error: error.message || 'Unknown error',
            }),
        };
    }
};