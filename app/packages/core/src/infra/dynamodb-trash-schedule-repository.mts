import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { TrashScheduleRepository } from '../usecase/trash-schedule-repository.mjs';
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { TrashSchedule } from 'trash-common';
export class DynamoDBTrashScheduleRepository implements TrashScheduleRepository {
  private db: DynamoDBDocumentClient;
  constructor(dbconfig: DynamoDBClientConfig, private readonly table_name: string, private readonly shared_table_name: string) {
    this.db = DynamoDBDocumentClient.from(new DynamoDBClient(dbconfig));
  }
  async findTrashScheduleByUserId(user_id: string) {
    try {
      const input = {
        TableName: this.table_name,
        Key: {
          id: user_id
        }
      };
      console.debug(input);
      const result = await this.db.send(new GetCommand(input));
      if (result.$metadata.httpStatusCode != 200) {
        throw new Error('ユーザーのゴミ捨てスケジュールの取得に失敗しました');
      }
      if (!result.Item) {
        return null;
      }

      if(result.Item.shared_id){
        console.log(`共有スケジュールが設定されています - ${user_id}, ${result.Item.shared_id}`)

        const sharedInput = {
          TableName: this.shared_table_name,
          Key: {
            shared_id: result.Item.shared_id
          }
        };
        console.debug(sharedInput);

        const sharedResult = await this.db.send(new GetCommand(sharedInput));

        if(sharedResult.$metadata.httpStatusCode != 200){
          throw new Error('共有スケジュールの取得に失敗しました');
        }

        return sharedResult.Item ? {
          trashData: JSON.parse(sharedResult.Item.description),
          checkedNextday: false
        } as TrashSchedule : null;
      } else {
        return {
          trashData: JSON.parse(result.Item.description),
          checkedNextday: false
        } as TrashSchedule;
      }
    } catch (e: any) {
      console.error(e.message || "不明なエラー")
      throw e;
    }
  }
}