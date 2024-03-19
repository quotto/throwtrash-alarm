import {  DynamoDBClient,DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { AlarmRepository } from '../usecase/alarm-repository.mjs';
import { Alarm, AlarmTime } from '../entity/alarm.mjs';
import { Device } from '../entity/device.mjs';
import { User } from '../entity/user.mjs';
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
      console.log(result);
      if(result.$metadata.httpStatusCode != 200) {
        throw new Error(`APIの呼び出しに失敗しました - ステータスコード: ${result.$metadata.httpStatusCode}`);
      }
      if(!result.Item) {
        throw new Error("アラームデータが見つかりませんでした");
      }
      return new Alarm(
        new Device(result.Item.device_token || "", result.Item.platform || ""),
        new AlarmTime(result.Item.alarm_time || ""),
        new User(result.Item.user_id || "")
        );
      } catch(e: any) {
        console.error("アラームデータの取得でエラーが発生しました")
        console.error(e.message || "不明なエラー");
        return null;
      }
    }

  async listByAlarmTime(alarm_time: AlarmTime): Promise<Alarm[]> {
    const alarms: Alarm[] = [];
    try {
      let last_evaluated_key = undefined;
      while(true) {
        const input = {
          TableName: this.table_name,
          IndexName: "alarm_time-index",
          QueryFilter: {
            alarm_time: {
              AttributeValueList: [alarm_time.formatTimeToHHMM()],
              ComparisonOperator: "EQ"
            }
          },
        } as QueryCommandInput;

        if(last_evaluated_key) {
          input.ExclusiveStartKey = last_evaluated_key;
        }
        const result = await this.db_client.send(new QueryCommand(input));
        console.log(result);
        if(result.$metadata.httpStatusCode != 200 || !result.Items) {
          console.error(result);
          throw new Error(`APIの呼び出しに失敗しました - ステータスコード: ${result.$metadata.httpStatusCode}`);
        }
        result.Items.forEach((item: any) => {
          try {
            alarms.push(new Alarm(
              new Device(item.device_token, item.platform),
              new AlarmTime(item.alarm_time),
              new User(item.user_id)
              ));
            } catch (e: any) {
              console.error(item);
              console.error("不正なデータが取得されました。結果から除外します。")
              console.error(e.message || "不明なエラー");
            }
        });
        if(!result.LastEvaluatedKey) {
          break;
        }
        last_evaluated_key = result.LastEvaluatedKey;

      }
      return alarms;
    } catch(e: any) {
      console.error("アラームデータの取得でエラーが発生しました")
      console.error(e.message || "不明なエラー");
      return [];
    }
  }

  async save(alarm: Alarm): Promise<boolean> {
    try {
      const result = await this.db_client.send(new PutCommand({
        TableName: this.table_name,
        Item: {
          device_token: alarm.getDevice().getToken(),
          alarm_time: alarm.getAlarmTime().formatTimeToHHMM(),
          user_id: alarm.getUser().getId(),
          platform: alarm.getDevice().getPlatform()
        }
      }));
      if(result.$metadata.httpStatusCode != 200) {
        throw new Error(`APIの呼び出しに失敗しました - ステータスコード: ${result.$metadata.httpStatusCode}`);
      }
      return true;
    } catch(e: any) {
      console.error("アラームのデータ登録に失敗しました");
      console.error(e.message || "不明なエラー");
      return false;
    }
  }

  async delete(alarm: Alarm): Promise<boolean> {
    try {
      const result = await this.db_client.send(new DeleteCommand({
        TableName: this.table_name,
        Key: {
          device_token: alarm.getDevice().getToken()
        }
      }));
      if(result.$metadata.httpStatusCode != 200) {
        throw new Error(`APIの呼び出しに失敗しました - ステータスコード: ${result.$metadata.httpStatusCode}`);
      }
      return true;
    } catch(e: any) {
      console.error("アラームデータの削除でエラーが発生しました");
      console.error(e.message || "不明なエラー");
      return false;
    }
  }
}
