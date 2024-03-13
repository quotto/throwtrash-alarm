import { DeleteItemCommand, DynamoDBClient,DynamoDBClientConfig,GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { AlarmRepositoryInterface } from '../service/alarm-repository-interface.mjs';
import { Alarm, AlarmTime } from '../domain/alarm.mjs';
import { Device } from '../domain/device.mjs';
import { User } from '../domain/user.mjs';
export class AlarmRepository implements AlarmRepositoryInterface{
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

    async create(alarm: Alarm): Promise<boolean> {
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

    async update(alarm: Alarm): Promise<boolean> {
      try {
        const result = await this.db_client.send(new UpdateCommand({
          TableName: this.table_name,
          Key: {
            device_token: alarm.getDevice().getToken()
          },
          UpdateExpression: "set alarm_time = :alarm_time, user_id = :user_id, platform = :platform",
          ExpressionAttributeValues: {
            ":alarm_time": alarm.getAlarmTime().formatTimeToHHMM(),
            ":user_id": alarm.getUser().getId(),
            ":platform": alarm.getDevice().getPlatform()
          },
          ReturnValues: "ALL_NEW"
        }));
        console.log(result)
        return true;
      } catch(e: any) {
        console.error("アラームデータの更新でエラーが発生しました")
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