import { AlarmTime } from "../entity/alarm.mjs";
import { AlarmScheduler } from "../usecase/alarm-scheduler.mjs";
import { CreateScheduleCommand, SchedulerClient, FlexibleTimeWindowMode, SchedulerClientConfig, GetScheduleCommand, ResourceNotFoundException } from "@aws-sdk/client-scheduler"
import logger from "./logger.mjs";

export class EventBridgeAlarmScheduler implements AlarmScheduler {
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
    async create(alarm_time: AlarmTime): Promise<boolean> {
        const event_bridge_scheduler_name = `throwtrash-alarm-${alarm_time.formatTimeToHHMM()}`;
        try {
            const result = await this.scheduler.send(new CreateScheduleCommand({
                FlexibleTimeWindow: {
                    Mode: FlexibleTimeWindowMode.OFF
                },
                Name: event_bridge_scheduler_name,
                ScheduleExpression: `cron(${alarm_time.getMinute()} ${alarm_time.getHour()} * * ? *)`,
                ScheduleExpressionTimezone: "Asia/Tokyo",
                GroupName: this.group_name,
                Target: {
                    Arn: this.alarm_trigger_function_arn,
                    RoleArn: this.alarm_trigger_function_role_arn,
                    Input: JSON.stringify({
                        alarm_time: {
                            hour: alarm_time.getHour(),
                            minute: alarm_time.getMinute()
                        }
                    }),
                    RetryPolicy: {
                        MaximumEventAgeInSeconds: 60,
                        MaximumRetryAttempts: 0
                    }
                },
                State: "ENABLED",
                Description: "ゴミ捨てのアラーム",
            }));
            if(result.$metadata.httpStatusCode !== 200) {
                logger.error('eventbridge-alarm-scheduler', 'create', 'アラームの作成に失敗しました', {error: result});
                throw new Error("アラームの作成に失敗しました")
            }
            logger.info('eventbridge-alarm-scheduler', 'create', 'アラームを作成しました', {resource: result});
            return true;
        } catch (e: any) {
            logger.error('eventbridge-alarm-scheduler', 'create', 'アラームの作成でエラーが発生しました', {error: e});
            throw e;
        }

    }
    async findByTime(alarm_time: AlarmTime): Promise<string | null> {
        const event_bridge_scheduler_name = `throwtrash-alarm-${alarm_time.formatTimeToHHMM()}`;
        // 名前が一致するEventBridgeSchdulerがあるかを確認
        try {
            const result = await this.scheduler.send(new GetScheduleCommand({
                Name: event_bridge_scheduler_name,
                GroupName: this.group_name
            }));
            if(result.$metadata.httpStatusCode !== 200) {
                logger.error('eventbridge-alarm-scheduler', 'findByTime', 'アラームの取得に失敗しました', {error: result});
                throw new Error("アラームの取得に失敗しました")
            }
            if (!result.Name) {
                logger.info('eventbridge-alarm-scheduler', 'findByTime', 'アラームが見つかりませんでした', {scheduler_name: event_bridge_scheduler_name});
                return null;
            }
            return result.Name;
        } catch (e: any) {
            if (e instanceof ResourceNotFoundException) {
                logger.error('eventbridge-alarm-scheduler', 'findByTime', 'アラームが見つかりませんでした', {scheduler_name: event_bridge_scheduler_name});
                return null;
            }
            logger.error('eventbridge-alarm-scheduler', 'findByTime', 'アラームの取得でエラーが発生しました', {scheduler_name: event_bridge_scheduler_name, error: e});
            throw e;
        }
    }
}