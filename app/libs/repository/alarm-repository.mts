import { DeleteItemCommand, DynamoDBClient,DynamoDBClientConfig,GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { AlarmRepositoryInterface } from '../service/alarm-repository-interface.mjs';
import { Alarm, AlarmTime } from '../domain/alarm.mjs';
import { Device } from '../domain/device.mjs';
import { User } from '../domain/user.mjs';
export class AlarmRepository implements AlarmRepositoryInterface{
  private db: DynamoDBClient;
  private table_name: string;
  constructor(config: DynamoDBClientConfig, table_name: string) {
    this.db = new DynamoDBClient(config);
    this.table_name = table_name;
  }
  async findByDeviceToken(deviceToken: string): Promise<Alarm | null> {
    try {
      const result = await this.db.send(new GetItemCommand({
        TableName: this.table_name,
        Key: {
          device_token: {
            S: deviceToken
          }
        }
      }));
      if(result.Item) {
        return new Alarm(
          new Device(result.Item.deviceToken.S || "", result.Item.platform.S || ""), 
          new AlarmTime(result.Item.time.S || ""), 
          new User(result.Item.userId.S || "")
        );
      }
      return null;
    } catch(e: any) {
      console.error("アラームデータの取得でエラーが発生しました")
      console.error(e.message || "不明なエラー");
      return null;
    }
  }

  async create(alarm: Alarm): Promise<boolean> {
    try {
      const result = await this.db.send(new PutItemCommand({
        TableName: this.table_name,
        Item: {
          device_token: {
            S: alarm.getDevice().getToken()
          },
          alarm_time: {
            S: alarm.getAlarmTime().formatTimeToHHMM()
          },
          user_id: {
            S: alarm.getUser().getId()
          },
          platform: {
            S: alarm.getDevice().getPlatform()
          }
        }
      }));
      return true;
    } catch(e: any) {
      console.error("アラームのデータ登録に失敗しました");
      console.error(e.message || "不明なエラー");
      return false;
    }
  }

  async update(alarm: Alarm): Promise<boolean> {
    try {
      const result = await this.db.send(new UpdateItemCommand({
        TableName: this.table_name,
        Key: {
          device_token: {
            S: alarm.getDevice().getToken()
          }
        },
        UpdateExpression: "set #alarm_time = :alarm_time, #user_id = :user_id, #platform = :platform",
        ExpressionAttributeNames: {
          "#alarm_time": "alarm_time",
          "#user_id": "user_id",
          "#platform": "platform"
        },
        ExpressionAttributeValues: {
          ":alarm_time": {
            S: alarm.getAlarmTime().formatTimeToHHMM(),
          },
          ":user_id": {
            S: alarm.getUser().getId()
          },
          ":platform": {
            S: alarm.getDevice().getPlatform()
          }
        }
      }));
      return true;
    } catch(e: any) {
      console.error("アラームデータの更新でエラーが発生しました")
      console.error(e.message || "不明なエラー");
      return false;
    }
  }

  async delete(alarm: Alarm): Promise<boolean> {
    try {
      await this.db.send(new DeleteItemCommand({
        TableName: this.table_name,
        Key: {
          device_token: {
            S: alarm.getDevice().getToken()
          }
        }
      }));
      return true;
    } catch(e: any) {
      console.error("アラームデータの削除でエラーが発生しました");
      console.error(e.message || "不明なエラー");
      return false;
    }
  }
}