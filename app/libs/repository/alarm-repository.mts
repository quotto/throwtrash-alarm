import { DeleteItemCommand, DynamoDBClient,DynamoDBClientConfig,GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { AlarmRepositoryInterface } from '../service/alarm-repository-interface.mjs';
import { Alarm } from '../domain/alarm.mjs';
import { Device } from '../domain/device.mjs';
import { User } from '../domain/user.mjs';
export class AlarmRepository implements AlarmRepositoryInterface{
  private db: DynamoDBClient;
  private table_name: string;
  constructor(config: DynamoDBClientConfig, table_name: string = 'throwtrash-alarm') {
    this.db = new DynamoDBClient(config);
    this.table_name = table_name;
  }
  async findByDeviceToken(deviceToken: string): Promise<Alarm | null> {
    try {
      const result = await this.db.send(new GetItemCommand({
        TableName: this.table_name,
        Key: {
          "deviceToken": {
            S: deviceToken
          }
        }
      }));
      if(result.Item) {
        return new Alarm(new Device(result.Item.deviceToken.S || "", result.Item.platform.S || ""), result.Item.time.S || "", new User(result.Item.userId.S || ""));
      }
      return null;
    } catch(e: any) {
      console.error(e.message || "アラームの取得で予期せぬエラーが発生しました");
      return null;
    }
  }

  async create(alarm: Alarm): Promise<boolean> {
    try {
      const result = await this.db.send(new PutItemCommand({
        TableName: this.table_name,
        Item: {
          deviceToken: {
            S: alarm.getDevice().getToken()
          },
          time: {
            S: alarm.getTime()
          },
          userId: {
            S: alarm.getUser().getId()
          },
          platform: {
            S: alarm.getDevice().getPlatform()
          }
        }
      }));
      return true;
    } catch(e: any) {
      console.error(e.message || "アラームの作成で予期せぬエラーが発生しました");
      return false;
    }
  }

  async update(alarm: Alarm): Promise<boolean> {
    try {
      const result = await this.db.send(new UpdateItemCommand({
        TableName: this.table_name,
        Key: {
          deviceToken: {
            S: alarm.getDevice().getToken()
          }
        },
        UpdateExpression: "set #time = :time, #userId = :userId, #platform = :platform",
        ExpressionAttributeNames: {
          "#time": "time",
          "#userId": "userId",
          "#platform": "platform"
        },
        ExpressionAttributeValues: {
          ":time": {
            S: alarm.getTime(),
          },
          ":userId": {
            S: alarm.getUser().getId()
          },
          ":platform": {
            S: alarm.getDevice().getPlatform()
          }
        }
      }));
      return true;
    } catch(e: any) {
      console.error(e.message || "アラームの更新で予期せぬエラーが発生しました");
      return false;
    }
  }

  async delete(alarm: Alarm): Promise<boolean> {
    try {
      await this.db.send(new DeleteItemCommand({
        TableName: this.table_name,
        Key: {
          deviceToken: {
            S: alarm.getDevice().getToken()
          }
        }
      }));
      return true;
    } catch(e: any) {
      console.error(e.message || "アラームの削除で予期せぬエラーが発生しました");
      return false;
    }
  }
}