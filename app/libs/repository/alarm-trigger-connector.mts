import { AlarmTriggerConnectorInterface } from "../service/alarm-trigger-connector-interface.mjs";
import { Scheduler,ResourceNotFoundException, CreateScheduleCommand, SchedulerClient, FlexibleTimeWindowMode, SchedulerClientConfig, GetScheduleCommand } from "@aws-sdk/client-scheduler"

export class AlarmTriggerConnector implements AlarmTriggerConnectorInterface {
    private scheduler: SchedulerClient;
    constructor(config: SchedulerClientConfig) {
        this.scheduler = new SchedulerClient(config);
    }
    async create(time: string): Promise<boolean> {
        const event_bridge_scheduler_name = `throwtrash-alarm-${time}`;
        try {
            const result = await this.scheduler.send(new CreateScheduleCommand({
                FlexibleTimeWindow: {
                    Mode: FlexibleTimeWindowMode.OFF
                },
                Name: event_bridge_scheduler_name,
                ScheduleExpression: `cron(0 ${time} * * ? *)`,
                ScheduleExpressionTimezone: "Asia/Tokyo",
                Target: {
                    Arn: process.env.ALARM_TRIGGER_LAMBDA_ARN!,
                    RoleArn: process.env.ALARM_TRIGGER_LAMBDA_ROLE_ARN!
                },
                State: "ENABLED",
                Description: "ゴミ捨てのアラーム",
            }));
            console.log(`アラームを作成しました: ${result.ScheduleArn}`)
            return true;
        } catch (e: any) {
            console.error(`アラーム${event_bridge_scheduler_name}の作成でエラーが発生しました`)
            console.error(e.message);
            return false;
        }

    }
    async findByTime(time: string): Promise<string | null> {
        const event_bridge_scheduler_name = `throwtrash-alarm-${time}`;
        // 名前が一致するEventBridgeSchdulerがあるかを確認
        try {
            const result = await this.scheduler.send(new GetScheduleCommand({
                Name: event_bridge_scheduler_name
            }));
            return result.Name!;
        } catch (e: any) {
            if (e instanceof ResourceNotFoundException) {
                console.log(`アラーム${event_bridge_scheduler_name}が見つかりませんでした`);
            }
            return null;
        }
    }
}