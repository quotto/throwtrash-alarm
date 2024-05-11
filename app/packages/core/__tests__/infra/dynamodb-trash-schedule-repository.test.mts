import { DynamoDBTrashScheduleRepository } from '../../src/infra/dynamodb-trash-schedule-repository.mjs';
import { TrashSchedule } from 'trash-common';
import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('DynamoDBTrashScheduleRepository', () => {
    const dbconfig: DynamoDBClientConfig = { region: 'ap-northeast-1' };
    const table_name = 'test_table';
    const shared_table_name = 'shared_table';
    const repository = new DynamoDBTrashScheduleRepository(dbconfig, table_name, shared_table_name);

    describe('findTrashScheduleByUserId', () => {

        test('shared_id無しで正常に取得できること', async () => {
            const user_id = 'test_user';
            const description = JSON.stringify({ test: 'test' });
            const checkedNextday = true;

            ddbMock.on(GetCommand, { TableName: table_name, Key: { id: user_id } }).resolves(
                {
                    Item: { id: user_id, shared_id: undefined, description: description, checkedNextday: checkedNextday },
                    $metadata: { httpStatusCode: 200 }
                }
            );

            const result = await repository.findTrashScheduleByUserId(user_id);
            expect(result).toEqual({ trashData: JSON.parse(description), checkedNextday: false });
        });
        test('shared_id有りで正常に取得できること', async () => {
            const user_id = 'test_user';
            const shared_id = 'shared_id';
            const description = JSON.stringify({ test: 'test' });
            const checkedNextday = true;

            ddbMock.on(GetCommand, { TableName: table_name, Key: { id: user_id } }).resolves(
                {
                    Item: { id: user_id, shared_id: shared_id, description: description, checkedNextday: checkedNextday },
                    $metadata: { httpStatusCode: 200 }
                }
            );

            ddbMock.on(GetCommand, { TableName: shared_table_name, Key: { id: shared_id } }).resolves(
                {
                    Item: { id: shared_id, description: description },
                    $metadata: { httpStatusCode: 200 }
                }
            );

            const result = await repository.findTrashScheduleByUserId(user_id);
            expect(result).toEqual({ trashData: JSON.parse(description), checkedNextday: false });
        });

        test('user_idに一致するデータが見つからない場合はnullが返ること', async () => {
            const user_id = 'test_user';
            ddbMock.on(GetCommand, { TableName: table_name, Key: { id: user_id } }).resolves(
                {
                    $metadata: { httpStatusCode: 200 }
                }
            );
            const result = await repository.findTrashScheduleByUserId(user_id);
            expect(result).toBeNull();
        });

        test('shared_idが設定されていてかつshared_idに一致するデータが見つからない場合はnullが返ること', async () => {
            const user_id = 'test_user';
            const shared_id = 'shared_id';
            const description = JSON.stringify({ test: 'test' });
            const checkedNextday = true;

            ddbMock.on(GetCommand, { TableName: table_name, Key: { id: user_id } }).resolves(
                {
                    Item: { id: user_id, shared_id, description, checkedNextday },
                    $metadata: { httpStatusCode: 200 }
                }
            );

            ddbMock.on(GetCommand, { TableName: shared_table_name, Key: { id: shared_id } }).resolves({
                $metadata: { httpStatusCode: 200 }
            });

            const result = await repository.findTrashScheduleByUserId(user_id);
            expect(result).toBeNull();
        });

        test('TrashScheduleTableのGetCommand結果が200以外の場合は例外が発生すること', async () => {
            const user_id = 'test_user';
            const shared_id = 'shared_id';
            const description = JSON.stringify({ test: 'test' });
            const checkedNextday = true;

            ddbMock.on(GetCommand, { TableName: table_name, Key: { id: user_id } }).resolves({
                $metadata: { httpStatusCode: 500 }
            });

            await expect(async()=>await repository.findTrashScheduleByUserId(user_id)).rejects.toThrow(Error);
        });
        test('SharedTrashScheduleTableのGetCommand結果が200以外の場合は例外が発生すること', async () => {
            const user_id = 'test_user';
            const shared_id = 'shared_id';
            const description = JSON.stringify({ test: 'test' });
            const checkedNextday = true;

            ddbMock.on(GetCommand, { TableName: table_name, Key: { id: user_id } }).resolves({
                Item: { id: user_id, shared_id, description, checkedNextday },
                $metadata: { httpStatusCode: 200 }
            });

            ddbMock.on(GetCommand, { TableName: shared_table_name, Key: { id: shared_id } }).resolves({
                $metadata: { httpStatusCode: 500 }
            });

            await expect(async()=>await repository.findTrashScheduleByUserId(user_id)).rejects.toThrow(Error);
        });
    });
});