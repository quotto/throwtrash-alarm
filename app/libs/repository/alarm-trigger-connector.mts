import { AlarmTriggerConnectorInterface } from "../service/alarm-trigger-connector-interface.mjs";
import { Scheduler,ResourceNotFoundException, CreateScheduleCommand, SchedulerClient, FlexibleTimeWindowMode } from "@aws-sdk/client-scheduler"

export class AlarmTriggerConnector implements AlarmTriggerConnectorInterface {
    async create(time: string): Promise<boolean> {
        const event_bridge_scheduler_name = `throwtrash-alarm-${time}`;
        const scheduler = new SchedulerClient()
        try {
            const result = await scheduler.send(new CreateScheduleCommand({
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
            return true;
        } catch (e: any) {
            console.error(e.message || "アラームの作成で予期せぬエラーが発生しました");
            return false;
        }

    }
    async findByTime(time: string): Promise<string | null> {
        const event_bridge_scheduler_name = `throwtrash-alarm-${time}`;
        // 名前が一致するEventBridgeSchdulerがあるかを確認
        const scheduler = new Scheduler();
        try {
            const result = await scheduler.getSchedule({
                Name: event_bridge_scheduler_name
            });
            return result.Name!;
        } catch (e: any) {
            if (e instanceof ResourceNotFoundException) {
                return null;
            }
            return null;
        }
    }
}