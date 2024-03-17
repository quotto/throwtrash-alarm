import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { TrashScheduleRepository } from '../usecase/trash-schedule-repository.mjs';
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { TrashSchedule } from 'trash-common';
class DynamoDBTrashScheduleRepository implements TrashScheduleRepository {
  private db: DynamoDBDocumentClient;
  constructor(dbconfig: DynamoDBClientConfig) {
    this.db = DynamoDBDocumentClient.from(new DynamoDBClient(dbconfig));
  }
  async findTrashScheduleByUserId(user_id: string) {
    try {
      const result = await this.db.send(new GetCommand({
        TableName: 'TrashSchedule',
        Key: {
          user_id: user_id
        }
      }));
      if (result.$metadata.httpStatusCode != 200) {
        throw new Error('ユーザーのゴミ捨てスケジュールの取得に失敗しました');
      }
      return result.Item ? {
        trashData: JSON.parse(result.Item.description),
        checkedNextday: false
      } as TrashSchedule : null;
    } catch (e: any) {
      console.error(e.message || "不明なエラー")
      return null;
    }
  }
}