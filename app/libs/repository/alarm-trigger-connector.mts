import { AlarmTime } from "../domain/alarm.mjs";
import { AlarmTriggerConnectorInterface } from "../service/alarm-trigger-connector-interface.mjs";
import { ResourceNotFoundException, CreateScheduleCommand, SchedulerClient, FlexibleTimeWindowMode, SchedulerClientConfig, GetScheduleCommand } from "@aws-sdk/client-scheduler"

export class AlarmTriggerConnector implements AlarmTriggerConnectorInterface {
    private scheduler: SchedulerClient;
    private group_name: string;
    private alarm_trigger_function_arn: string;
    private alarm_trigger_function_role_arn: string;
    constructor(config: SchedulerClientConfig,group_name: string, trigger_function_arn: string, trigger_function_role_arn: string) {
        if(group_name === "") {
            throw new Error("EventBridgeSchdulerのグループ名が指定されていません")
        }
        if(trigger_function_arn === "") {
            throw new Error("アラームトリガー用のLambda関数のARNが指定されていません")
        }
        if(trigger_function_role_arn === "") {
            throw new Error("アラームトリガー用のLambda関数の実行ロールのARNが指定されていません")
        }
        this.scheduler = new SchedulerClient(config);
        this.group_name = group_name;
        this.alarm_trigger_function_arn = trigger_function_arn;
        this.alarm_trigger_function_role_arn = trigger_function_role_arn;
    }
    async create(alarmTime: AlarmTime): Promise<boolean> {
        const event_bridge_scheduler_name = `throwtrash-alarm-${alarmTime.formatTimeToHHMM()}`;
        try {
            const result = await this.scheduler.send(new CreateScheduleCommand({
                FlexibleTimeWindow: {
                    Mode: FlexibleTimeWindowMode.OFF
                },
                Name: event_bridge_scheduler_name,
                ScheduleExpression: `cron(${alarmTime.getMinute()} ${alarmTime.getHour()} * * ? *)`,
                ScheduleExpressionTimezone: "Asia/Tokyo",
                GroupName: this.group_name,
                Target: {
                    Arn: this.alarm_trigger_function_arn,
                    RoleArn: this.alarm_trigger_function_role_arn
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
    async findByTime(alarmTime: AlarmTime): Promise<string | null> {
        const event_bridge_scheduler_name = `throwtrash-alarm-${alarmTime.formatTimeToHHMM()}`;
        // 名前が一致するEventBridgeSchdulerがあるかを確認
        try {
            const result = await this.scheduler.send(new GetScheduleCommand({
                Name: event_bridge_scheduler_name,
                GroupName: this.group_name
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