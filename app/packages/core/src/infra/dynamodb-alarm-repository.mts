import {  DynamoDBClient,DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand, DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { AlarmRepository } from '../usecase/alarm-repository.mjs';
import { Alarm, AlarmTime } from '../entity/alarm.mjs';
import { Device } from '../entity/device.mjs';
import { User } from '../entity/user.mjs';
import { AlarmHistory } from '../entity/alarm-history.mjs';
import logger from './logger.mjs';

type AlarmItem = {device_token: string, alarm_time: string, user_id: string, platform: string, created_at: string, last_successful_time?: string, last_failed_time?: string}
export class DynamoDBAlarmRepository implements AlarmRepository{
  private db_client: DynamoDBDocumentClient;
  private table_name: string;
  constructor(config: DynamoDBClientConfig, table_name: string) {
    this.db_client = DynamoDBDocumentClient.from(new DynamoDBClient(config),{marshallOptions: { removeUndefinedValues: true }});
    this.table_name = table_name;
  }
  async findByDeviceToken(device_token: string): Promise<Alarm | null> {
    try {
      const input = new GetCommand({
        TableName: this.table_name,
        Key: {
          device_token: device_token
        }
      });
      const result = await this.db_client.send(input);
      logger.info('dynamodb-alarm-repository', 'findByDeviceToken', 'アラームデータを取得しました', {data: result});
      if(result.$metadata.httpStatusCode != 200) {
        const message = `APIの呼び出しに失敗しました - ステータスコード: ${result.$metadata.httpStatusCode}`;
        logger.error('dynamodb-alarm-repository', 'findByDeviceToken', message, {error: result});
        throw new Error(message);
      }
      if(!result.Item) {
        logger.warn('dynamodb-alarm-repository', 'findByDeviceToken', 'デバイストークンに一致するアラームデータが見つかりませんでした', {device_token: device_token});
        return null;
      }
      const { created_at, last_successful_time, last_failed_time } = result.Item;

      const alarm_history = new AlarmHistory(
        new Date(created_at),
        {
          last_successful_time: last_successful_time ? new Date(last_successful_time) : undefined,
          last_failed_time: last_failed_time ? new Date(last_failed_time) : undefined
        }
      );
      return new Alarm(
        new Device(result.Item.device_token || "", result.Item.platform || ""),
        new AlarmTime(result.Item.alarm_time || ""),
        new User(result.Item.user_id || ""),
        alarm_history
      );
    } catch(e: any) {
      logger.error('dynamodb-alarm-repository', 'findByDeviceToken', 'アラームデータの取得に失敗しました', {error: e});
      throw e;
    }
  }
  async listByAlarmTime(alarm_time: AlarmTime): Promise<Alarm[]> {
    const alarms: Alarm[] = [];
    try {
      let last_evaluated_key = undefined;
      while(true) {
        const input = {
          TableName: this.table_name,
          IndexName: "alarm_time_index",
          KeyConditionExpression: "alarm_time = :alarm_time",
          ExpressionAttributeValues: {
            ":alarm_time": alarm_time.formatTimeToHHMM()
          },
        } as QueryCommandInput;

        if(last_evaluated_key) {
          input.ExclusiveStartKey = last_evaluated_key;
        }
        const result = await this.db_client.send(new QueryCommand(input));
        logger.info('dynamodb-alarm-repository', 'listByAlarmTime', 'アラームデータを取得しました', {data: result});
        if(result.$metadata.httpStatusCode != 200 || !result.Items) {
          const message = `APIの呼び出しに失敗しました - ステータスコード: ${result.$metadata.httpStatusCode}`;
          logger.error('dynamodb-alarm-repository', 'listByAlarmTime', message, {error: result});
          throw new Error(message);
        }
        result.Items.forEach((item: any) => {
          const { created_at, last_successful_time, last_failed_time } = item;
          const alarm_history = new AlarmHistory(
            new Date(created_at),
            { last_successful_time: last_successful_time ? new Date(last_successful_time) : undefined,
              last_failed_time: last_failed_time ? new Date(last_failed_time) : undefined
            }
          );
          try {
            alarms.push(new Alarm(
              new Device(item.device_token, item.platform),
              new AlarmTime(item.alarm_time),
              new User(item.user_id),
              alarm_history
            ));
          } catch (e: any) {
            logger.error('dynamodb-alarm-repository', 'listByAlarmTime', '不正なデータが取得されました。結果から除外します。', {data: item, error: e});
          }
        });
        if(!result.LastEvaluatedKey) {
          break;
        }
        last_evaluated_key = result.LastEvaluatedKey;
      }
      return alarms;
    } catch(e: any) {
      logger.error('dynamodb-alarm-repository', 'listByAlarmTime', 'アラームデータの取得に失敗しました', {error: e});
      throw e;
    }
  }

  async save(alarm: Alarm): Promise<boolean> {
    try {
      const result = await this.db_client.send(new PutCommand({
        TableName: this.table_name,
        Item: this.convertAlarmToItem(alarm)
      }));
      if(result.$metadata.httpStatusCode != 200) {
        const message = `APIの呼び出しに失敗しました - ステータスコード: ${result.$metadata.httpStatusCode}`;
        logger.error('dynamodb-alarm-repository', 'save', message, {error: result});
        throw new Error(message);
      }
      return true;
    } catch(e: any) {
      logger.error('dynamodb-alarm-repository', 'save', 'アラームのデータ登録に失敗しました', {error: e});
      throw e;
    }
  }

  async saveAll(alarms: Alarm[]): Promise<void> {
    logger.debug('dynamodb-alarm-repository', 'saveAll', 'アラームデータを保存します', {data: alarms});
    // 25件ずつリクエストを送信
    for(let i = 0; i < alarms.length; i += 25) {
      const write_requests = alarms.slice(i, i + 25).map((alarm) => {
        return {
          PutRequest: {
            Item: this.convertAlarmToItem(alarm)
          }
        };
      });
      try {
        const result = await this.db_client.send(new BatchWriteCommand({
          RequestItems: {
            [this.table_name]: write_requests
          }
        }));
        if(result.$metadata.httpStatusCode != 200) {
          const message = `APIの呼び出しに失敗しました - ステータスコード: ${result.$metadata.httpStatusCode}`
          logger.error('dynamodb-alarm-repository', 'saveAll', message, {error: result});
          throw new Error(message);
        }
        if(result.UnprocessedItems && result.UnprocessedItems[this.table_name]) {
          logger.error('dynamodb-alarm-repository', 'saveAll', '保存に失敗したデータがあります', {data: result.UnprocessedItems[this.table_name]});
        }
      } catch(e: any) {
        logger.error('dynamodb-alarm-repository', 'saveAll', 'アラームのデータ登録に失敗しました', {error: e});
      }
    }
  }

  async delete(alarm: Alarm): Promise<boolean> {
    try {
      const result = await this.db_client.send(new DeleteCommand({
        TableName: this.table_name,
        Key: {
          device_token: alarm.device.getToken()
        }
      }));
      if(result.$metadata.httpStatusCode != 200) {
        const message = `APIの呼び出しに失敗しました - ステータスコード: ${result.$metadata.httpStatusCode}`
        logger.error('dynamodb-alarm-repository', 'delete', message, {error: result});
        throw new Error(message);
      }
      return true;
    } catch(e: any) {
      logger.error('dynamodb-alarm-repository', 'delete', 'アラームデータの削除に失敗しました', {error: e});
      throw e;
    }
  }

  private convertAlarmToItem(alarm: Alarm): AlarmItem  {
    const item: AlarmItem = {
      device_token: alarm.device.getToken(),
      alarm_time: alarm.alarmTime.formatTimeToHHMM(),
      user_id: alarm.user.getId(),
      platform: alarm.device.getPlatform(),
      created_at: alarm.alarmHistory.created_at.toISOString(),
    };
    if(alarm.alarmHistory.last_successful_time) {
      item.last_successful_time = alarm.alarmHistory.last_successful_time.toISOString();
    }
    if(alarm.alarmHistory.last_failed_time) {
      item.last_failed_time = alarm.alarmHistory.last_failed_time.toISOString();
    }
    return item;
  }
}
