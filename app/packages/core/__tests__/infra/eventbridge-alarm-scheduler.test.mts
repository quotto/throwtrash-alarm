import { SchedulerClientConfig, CreateScheduleCommand, SchedulerClient, FlexibleTimeWindowMode, GetScheduleCommand } from '@aws-sdk/client-scheduler';
import { mockClient } from 'aws-sdk-client-mock';
import { AlarmTime } from '../../src/entity/alarm-time.mjs';
const schedulerMock = mockClient(SchedulerClient);
import { EventBridgeAlarmScheduler } from '../../src/infra/eventbridge-alarm-scheduler.mjs';

describe('EventBridgeAlarmScheduler', () => {
  describe('constructor', () => {
    test('正常にインスタンスが生成できること', () => {
      const config: SchedulerClientConfig = { region: 'ap-northeast-1' };
      const group_name = 'test_group';
      const trigger_function_arn = 'arn:aws:lambda:ap-northeast-1:123456789012:function:throwtrash-alarm-trigger';
      const trigger_function_role_arn = 'arn:aws:iam::123456789012:role/throwtrash-alarm-trigger-role';
      const scheduler = new EventBridgeAlarmScheduler(config, group_name, trigger_function_arn, trigger_function_role_arn);
      expect(scheduler).toBeInstanceOf(EventBridgeAlarmScheduler);
    });
    test('group_nameが空文字の場合はエラーが発生すること', () => {
      const config: SchedulerClientConfig = { region: 'ap-northeast-1' };
      const group_name = '';
      const trigger_function_arn = 'arn:aws:lambda:ap-northeast-1:123456789012:function:throwtrash-alarm-trigger';
      const trigger_function_role_arn = 'arn:aws:iam::123456789012:role/throwtrash-alarm-trigger-role';
      expect(() => new EventBridgeAlarmScheduler(config, group_name, trigger_function_arn, trigger_function_role_arn)).toThrow(Error);
    });
    test('trigger_function_arnが空文字の場合はエラーが発生すること', () => {
      const config: SchedulerClientConfig = { region: 'ap-northeast-1' };
      const group_name = 'test_group';
      const trigger_function_arn = '';
      const trigger_function_role_arn = 'arn:aws:iam::123456789012:role/throwtrash-alarm-trigger-role';
      expect(() => new EventBridgeAlarmScheduler(config, group_name, trigger_function_arn, trigger_function_role_arn)).toThrow(Error);
    });
    test('trigger_function_role_arnが空文字の場合はエラーが発生すること', () => {
      const config: SchedulerClientConfig = { region: 'ap-northeast-1' };
      const group_name = 'test_group';
      const trigger_function_arn = 'arn:aws:lambda:ap-northeast-1:123456789012:function:throwtrash-alarm-trigger';
      const trigger_function_role_arn = '';
      expect(() => new EventBridgeAlarmScheduler(config, group_name, trigger_function_arn, trigger_function_role_arn)).toThrow(Error);
    });
  });
  describe('create', () => {
    test('12:00で正常にアラームが作成できること', async () => {
      const config: SchedulerClientConfig = { region: 'ap-northeast-1' };
      const group_name = 'test_group';
      const trigger_function_arn = 'arn:aws:lambda:ap-northeast-1:123456789012:function:throwtrash-alarm-trigger';
      const trigger_function_role_arn = 'arn:aws:iam::123456789012:role/throwtrash-alarm-trigger-role';

      schedulerMock.on(CreateScheduleCommand, {
        FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF },
        Name: 'throwtrash-alarm-1200',
        ScheduleExpression: 'cron(0 12 * * ? *)',
        ScheduleExpressionTimezone: 'Asia/Tokyo',
        GroupName: group_name,
        Target: {
          Arn: trigger_function_arn,
          RoleArn: trigger_function_role_arn,
          Input: JSON.stringify({ alarm_time: { hour: 12, minute: 0 } }),
          RetryPolicy: { MaximumEventAgeInSeconds: 60, MaximumRetryAttempts: 0 }
        },
        State: 'ENABLED',
        Description: 'ゴミ捨てのアラーム'
      }).resolves({
        $metadata: { httpStatusCode: 200 },
        ScheduleArn: 'arn:aws:scheduler:ap-northeast-1:123456789012:schedule/throwtrash-alarm-1200' });

      const scheduler = new EventBridgeAlarmScheduler(config, group_name, trigger_function_arn, trigger_function_role_arn);
      const alarm_time = new AlarmTime('1200');
      const result = await scheduler.create(alarm_time);
      expect(result).toBe(true);
    });
    test('00:00で正常にアラームが作成できること', async () => {
      const config: SchedulerClientConfig = { region: 'ap-northeast-1' };
      const group_name = 'test_group';
      const trigger_function_arn = 'arn:aws:lambda:ap-northeast-1:123456789012:function:throwtrash-alarm-trigger';
      const trigger_function_role_arn = 'arn:aws:iam::123456789012:role/throwtrash-alarm-trigger-role';

      schedulerMock.on(CreateScheduleCommand, {
        FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF },
        Name: 'throwtrash-alarm-0000',
        ScheduleExpression: 'cron(0 0 * * ? *)',
        ScheduleExpressionTimezone: 'Asia/Tokyo',
        GroupName: group_name,
        Target: {
          Arn: trigger_function_arn,
          RoleArn: trigger_function_role_arn,
          Input: JSON.stringify({ alarm_time: { hour: 0, minute: 0 } }),
          RetryPolicy: { MaximumEventAgeInSeconds: 60, MaximumRetryAttempts: 0 }
        },
        State: 'ENABLED',
        Description: 'ゴミ捨てのアラーム'
      }).resolves({
        $metadata: { httpStatusCode: 200 },
        ScheduleArn: 'arn:aws:scheduler:ap-northeast-1:123456789012:schedule/throwtrash-alarm-0000'
      });

      const scheduler = new EventBridgeAlarmScheduler(config, group_name, trigger_function_arn, trigger_function_role_arn);
      const alarm_time = new AlarmTime('0000');
      const result = await scheduler.create(alarm_time);
      expect(result).toBe(true);
    });
    test('23:59で正常にアラームが作成できること', async () => {
      const config: SchedulerClientConfig = { region: 'ap-northeast-1' };
      const group_name = 'test_group';
      const trigger_function_arn = 'arn:aws:lambda:ap-northeast-1:123456789012:function:throwtrash-alarm-trigger';
      const trigger_function_role_arn = 'arn:aws:iam::123456789012:role/throwtrash-alarm-trigger-role';

      schedulerMock.on(CreateScheduleCommand, {
        FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF },
        Name: 'throwtrash-alarm-2359',
        ScheduleExpression: 'cron(59 23 * * ? *)',
        ScheduleExpressionTimezone: 'Asia/Tokyo',
        GroupName: group_name,
        Target: {
          Arn: trigger_function_arn,
          RoleArn: trigger_function_role_arn,
          Input: JSON.stringify({ alarm_time: { hour: 23, minute: 59 } }),
          RetryPolicy: { MaximumEventAgeInSeconds: 60, MaximumRetryAttempts: 0 }
        },
        State: 'ENABLED',
        Description: 'ゴミ捨てのアラーム'
      }).resolves({
        $metadata: { httpStatusCode: 200 },
        ScheduleArn: 'arn:aws:scheduler:ap-northeast-1:123456789012:schedule/throwtrash-alarm-2359'
      });

      const scheduler = new EventBridgeAlarmScheduler(config, group_name, trigger_function_arn, trigger_function_role_arn);
      const alarm_time = new AlarmTime('2359');
      const result = await scheduler.create(alarm_time);
      expect(result).toBe(true);
    });
    test('CreateScheduleCommandのステータスコードが200以外の場合はエラーが発生すること', async () => {
      const config: SchedulerClientConfig = { region: 'ap-northeast-1' };
      const group_name = 'test_group';
      const trigger_function_arn = 'arn:aws:lambda:ap-northeast-1:123456789012:function:throwtrash-alarm-trigger';
      const trigger_function_role_arn = 'arn:aws:iam::123456789012:role/throwtrash-alarm-trigger-role';

      schedulerMock.on(CreateScheduleCommand, {
        FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF },
        Name: 'throwtrash-alarm-1200',
        ScheduleExpression: 'cron(0 12 * * ? *)',
        ScheduleExpressionTimezone: 'Asia/Tokyo',
        GroupName: group_name,
        Target: {
          Arn: trigger_function_arn,
          RoleArn: trigger_function_role_arn,
          Input: JSON.stringify({ alarm_time: { hour: 12, minute: 0 } }),
          RetryPolicy: { MaximumEventAgeInSeconds: 60, MaximumRetryAttempts: 0 }
        },
        State: 'ENABLED',
        Description: 'ゴミ捨てのアラーム'
      }).resolves({ $metadata: { httpStatusCode: 400 } });

      const scheduler = new EventBridgeAlarmScheduler(config, group_name, trigger_function_arn, trigger_function_role_arn);
      const alarm_time = new AlarmTime('1200');
      await expect(scheduler.create(alarm_time)).rejects.toThrow(Error);
    });
  });
  describe('findByTime', () => {
    test('12:00のアラームが存在する場合はリソース名が返ること', async () => {
      const config: SchedulerClientConfig = { region: 'ap-northeast-1' };
      const resource_name = 'throwtrash-alarm-1200'
      const group_name = 'test_group';
      const trigger_function_arn = 'arn:aws:lambda:ap-northeast-1:123456789012:function:throwtrash-alarm-trigger';
      const trigger_function_role_arn = 'arn:aws:iam::123456789012:role/throwtrash-alarm-trigger-role';

      schedulerMock.on(GetScheduleCommand, { Name: resource_name,GroupName: group_name }).resolves({
        $metadata: { httpStatusCode: 200 },
        Name: resource_name
      });

      const scheduler = new EventBridgeAlarmScheduler(config, group_name, trigger_function_arn, trigger_function_role_arn);
      const alarm_time = new AlarmTime('1200');
      const result = await scheduler.findByTime(alarm_time);
      expect(result).toBe(resource_name);
    });
    test('00:00のアラームが存在する場合はリソース名が返ること', async () => {
      const config: SchedulerClientConfig = { region: 'ap-northeast-1' };
      const resource_name = 'throwtrash-alarm-0000'
      const group_name = 'test_group';
      const trigger_function_arn = 'arn:aws:lambda:ap-northeast-1:123456789012:function:throwtrash-alarm-trigger';
      const trigger_function_role_arn = 'arn:aws:iam::123456789012:role/throwtrash-alarm-trigger-role';

      schedulerMock.on(GetScheduleCommand, { Name: resource_name,GroupName: group_name }).resolves({
        $metadata: { httpStatusCode: 200 },
        Name: resource_name
      });

      const scheduler = new EventBridgeAlarmScheduler(config, group_name, trigger_function_arn, trigger_function_role_arn);
      const alarm_time = new AlarmTime('0000');
      const result = await scheduler.findByTime(alarm_time);
      expect(result).toBe(resource_name);
    });
    test('23:59のアラームが存在する場合はリソース名が返ること', async () => {
      const config: SchedulerClientConfig = { region: 'ap-northeast-1' };
      const resource_name = 'throwtrash-alarm-2359'
      const group_name = 'test_group';
      const trigger_function_arn = 'arn:aws:lambda:ap-northeast-1:123456789012:function:throwtrash-alarm-trigger';
      const trigger_function_role_arn = 'arn:aws:iam::123456789012:role/throwtrash-alarm-trigger-role';

      schedulerMock.on(GetScheduleCommand, { Name: resource_name,GroupName: group_name }).resolves({
        $metadata: { httpStatusCode: 200 },
        Name: resource_name
      });

      const scheduler = new EventBridgeAlarmScheduler(config, group_name, trigger_function_arn, trigger_function_role_arn);
      const alarm_time = new AlarmTime('2359');
      const result = await scheduler.findByTime(alarm_time);
      expect(result).toBe(resource_name);
    });
    test('12:00のアラームが存在しない場合はnullが返ること', async () => {
      const config: SchedulerClientConfig = { region: 'ap-northeast-1' };
      const resource_name = 'throwtrash-alarm-1200'
      const group_name = 'test_group';
      const trigger_function_arn = 'arn:aws:lambda:ap-northeast-1:123456789012:function:throwtrash-alarm-trigger';
      const trigger_function_role_arn = 'arn:aws:iam::123456789012:role/throwtrash-alarm-trigger-role';

      schedulerMock.on(GetScheduleCommand, { Name: resource_name,GroupName: group_name }).resolves({
        $metadata: { httpStatusCode: 200 }
      });

      const scheduler = new EventBridgeAlarmScheduler(config, group_name, trigger_function_arn, trigger_function_role_arn);
      const alarm_time = new AlarmTime('1200');
      const result = await scheduler.findByTime(alarm_time);
      expect(result).toBeNull();
    });
    test('GetScheduleCommandのステータスコードが200以外の場合はエラーが発生すること', async () => {
      const config: SchedulerClientConfig = { region: 'ap-northeast-1' };
      const resource_name = 'throwtrash-alarm-1200'
      const group_name = 'test_group';
      const trigger_function_arn = 'arn:aws:lambda:ap-northeast-1:123456789012:function:throwtrash-alarm-trigger';
      const trigger_function_role_arn = 'arn:aws:iam::123456789012:role/throwtrash-alarm-trigger-role';

      schedulerMock.on(GetScheduleCommand, { Name: resource_name,GroupName: group_name }).resolves({
        $metadata: { httpStatusCode: 400 }
      });

      const scheduler = new EventBridgeAlarmScheduler(config, group_name, trigger_function_arn, trigger_function_role_arn);
      const alarm_time = new AlarmTime('1200');
      await expect(scheduler.findByTime(alarm_time)).rejects.toThrow(Error);
    });
  });
});