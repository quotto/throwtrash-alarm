import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { TrashScheduleRepository } from '../usecase/trash-schedule-repository.mjs';
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { TrashSchedule } from 'trash-common';
import logger from './logger.mjs';
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
      logger.debug('dynamodb-trash-schedule-repository', 'findTrashScheduleByUserId', 'ユーザーのゴミ捨てスケジュールを取得します', {data: input});
      const result = await this.db.send(new GetCommand(input));
      if (result.$metadata.httpStatusCode != 200) {
        const message = `APIの呼び出しに失敗しました - ステータスコード: ${result.$metadata.httpStatusCode}`;
        logger.error('dynamodb-trash-schedule-repository', 'findTrashScheduleByUserId', message, {error: result});
        throw new Error(message);
      }
      if (!result.Item) {
        return null;
      }

      if(result.Item.shared_id){
        logger.info('dynamodb-trash-schedule-repository', 'findTrashScheduleByUserId', '共有スケジュールが設定されています',{user_id: user_id, shared_id: result.Item.shared_id});

        const sharedInput = {
          TableName: this.shared_table_name,
          Key: {
            shared_id: result.Item.shared_id
          }
        };
        logger.debug('dynamodb-trash-schedule-repository', 'findTrashScheduleByUserId', '共有スケジュールを取得します', {data: sharedInput});

        const sharedResult = await this.db.send(new GetCommand(sharedInput));

        if(sharedResult.$metadata.httpStatusCode != 200){
          const message = `APIの呼び出しに失敗しました - ステータスコード: ${sharedResult.$metadata.httpStatusCode}`;
          logger.error('dynamodb-trash-schedule-repository', 'findTrashScheduleByUserId', message, {error: sharedResult});
          throw new Error(message);
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
      logger.error('dynamodb-trash-schedule-repository', 'findTrashScheduleByUserId', 'ゴミ出しスケジュールの取得に失敗しました', {error: e});
      throw e;
    }
  }
}