import {DynamoDB} from 'aws-sdk';
export class AlarmRepository implements AlarmRepositoryInterface{
  db: DynamoDB.DocumentClient;
  constructor(db: DynamoDB.DocumentClient) {
    this.db = db;
  }
  async findByDeviceToken(deviceToken: string): Promise<Alarm | null> {
    try {
      const result = await this.db.get({
        TableName: 'throwtrash-alarm',
        Key: {
          deviceToken: deviceToken
        }
      }).promise();
      if(result.$response.error) {
        console.error("アラームの取得に失敗しました");
        console.error(JSON.stringify(result.$response.error));
        throw new Error(result.$response.error.message);
      }
      if(result.Item) {
        return new Alarm(new Device(result.Item.deviceToken, result.Item.platform), result.Item.time, new User(result.Item.userId));
      }
      return null;
    } catch(e: any) {
      console.error(e.message || "アラームの取得で予期せぬエラーが発生しました");
      return null;
    }
  }

  async create(alarm: Alarm): Promise<boolean> {
    try {
      const result = await this.db.put({
        TableName: 'throwtrash-alarm',
        Item: {
          deviceToken: alarm.getDevice().getToken(),
          time: alarm.getTime(),
          userId: alarm.getUser().getId(),
          platform: alarm.getDevice().getPlatform()
        }
      }).promise();
      if (result.$response.error) {
        console.error("アラームの作成に失敗しました ");
        console.error(JSON.stringify(result.$response.error));
        throw new Error(result.$response.error.message);
      }
      return true;
    } catch(e: any) {
      console.error(e.message || "アラームの作成で予期せぬエラーが発生しました");
      return false;
    }
  }

  async update(alarm: Alarm): Promise<boolean> {
    try {
      const result = await this.db.update({
        TableName: 'throwtrash-alarm',
        Key: {
          deviceToken: alarm.getDevice().getToken()
        },
        UpdateExpression: "set #time = :time, #userId = :userId, #platform = :platform",
        ExpressionAttributeNames: {
          "#time": "time",
          "#userId": "userId",
          "#platform": "platform"
        },
        ExpressionAttributeValues: {
          ":time": alarm.getTime(),
          ":userId": alarm.getUser().getId(),
          ":platform": alarm.getDevice().getPlatform()
        }
      }).promise();
      if(result.$response.error) {
        console.error("アラームの更新に失敗しました");
        console.error(JSON.stringify(result.$response.error));
        throw new Error(result.$response.error.message);
      }
      return true;
    } catch(e: any) {
      console.error(e.message || "アラームの更新で予期せぬエラーが発生しました");
      return false;
    }
  }

  async delete(alarm: Alarm): Promise<boolean> {
    try {
      const result = await this.db.delete({
        TableName: 'throwtrash-alarm',
        Key: {
          deviceToken: alarm.getDevice().getToken()
        }
      }).promise();
      if(result.$response.error) {
        console.error("アラームの削除に失敗しました");
        console.error(JSON.stringify(result.$response.error));
        throw new Error(result.$response.error.message);
      }
      return true;
    } catch(e: any) {
      console.error(e.message || "アラームの削除で予期せぬエラーが発生しました");
      return false;
    }
  }
}