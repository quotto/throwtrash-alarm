import { jest } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import  clientdynamodb, { DynamoDBClient, TransactionConflictException } from '@aws-sdk/client-dynamodb';
import  libdynamodb, { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Alarm, AlarmTime } from '../../src/entity/alarm.mjs';

const ddbMock = mockClient(DynamoDBDocumentClient);
import { DynamoDBAlarmRepository } from '../../src/infra/dynamodb-alarm-repository.mjs';
import { User } from '../../src/entity/user.mjs';
import { Device } from '../../src/entity/device.mjs';
describe('DynamoDBAlarmRepository', () => {
  describe('findByDeviceToken', () => {
    beforeEach(() => {
      ddbMock.reset();
    });
    test('should return an alarm', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          device_token: 'dummy_device_token',
          platform: 'ios',
          alarm_time: '0800',
          user_id: 'dummy_user_id'
        },
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const result = await alarmRepository.findByDeviceToken('dummy_device_token');
      expect(result?.getAlarmTime()).toEqual(new AlarmTime('0800'));
    });
    test('ステータスコードが200以外の場合はエラーを投げる', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
        },
        $metadata: {
          httpStatusCode: 500
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      await expect(async()=>await alarmRepository.findByDeviceToken('dummy_device')).rejects.toThrow(Error);
    });
    test('デバイストークンに一致するアラームデータが見つからない場合はnullを返す', async () => {
      ddbMock.on(GetCommand).resolves({
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const result = await alarmRepository.findByDeviceToken('dummy_device_token');
      expect(result).toBeNull();
    });
  });
  describe('listByAlarmTime', () => {
    beforeEach(() => {
      ddbMock.reset();
    });
    test('1件のデータ取得', async () => {
      ddbMock.on(libdynamodb.QueryCommand).resolves({
        Items: [
          {
            device_token: 'dummy_device_token',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id'
          }
        ],
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const result = await alarmRepository.listByAlarmTime(new AlarmTime('0800'));
      expect(result[0].getAlarmTime()).toEqual(new AlarmTime('0800'));
    });
    test('2件のデータ取得', async () => {
      ddbMock.on(libdynamodb.QueryCommand).resolves({
        Items: [
          {
            device_token: 'dummy_device',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id'
          },
          {
            device_token: 'dummy_device2',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id2'
          }
        ],
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const result = await alarmRepository.listByAlarmTime(new AlarmTime('0800'));
      expect(result.length).toBe(2);
      expect(result[0].getDevice().getToken()).toBe('dummy_device');
      expect(result[1].getDevice().getToken()).toBe('dummy_device2');
    });
    test('last_evaluated_keyが存在する場合', async () => {
      const dummy_table_name = 'dummy_table_name';
      const input_alarm_time = '0800';
      const input_alarm_index = 'alarm_time_index';
      ddbMock.on(QueryCommand, {
        TableName: dummy_table_name,
        IndexName: input_alarm_index,
        KeyConditionExpression: "alarm_time = :alarm_time",
        ExpressionAttributeValues: {
          ":alarm_time": input_alarm_time
        }
      }).resolves({
        Items: [
          {
            device_token: 'dummy_device',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id'
          },
          {
            device_token: 'dummy_device2',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id2'
          }
        ],
        LastEvaluatedKey: {
          device_token: 'dummy_device2'
        },
        $metadata: {
          httpStatusCode: 200
        }
      }).on(QueryCommand,{
        TableName: dummy_table_name,
        IndexName: input_alarm_index,
        KeyConditionExpression: "alarm_time = :alarm_time",
        ExpressionAttributeValues: {
          ":alarm_time": input_alarm_time
        },
        ExclusiveStartKey: {
          device_token: 'dummy_device2'
        }
      }).resolves({
        Items: [
          {
            device_token: 'dummy_device_3',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id_3'
          }
        ],
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, dummy_table_name);
      console.log
      const result = await alarmRepository.listByAlarmTime(new AlarmTime('0800'));
      expect(result.length).toBe(3);
      expect(result[0].getDevice().getToken()).toBe('dummy_device');
      expect(result[1].getDevice().getToken()).toBe('dummy_device2');
      expect(result[2].getDevice().getToken()).toBe('dummy_device_3');
      expect(ddbMock.calls().length).toBe(2);
    });
    test('複数のデータが存在する場合に不正なデータが含まれている場合は当該のデータを除外して取得する', async () => {
      ddbMock.on(libdynamodb.QueryCommand).resolves({
        Items: [
          {
            device_token: 'dummy_device',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id'
          },
          {
            device_token: 'dummy_device2',
            platform: 'invalid_platform',
            alarm_time: '0800',
            user_id: 'dummy_user_id2'
          },
          {
            device_token: 'dummy_device3',
            platform: 'ios',
            alarm_time: 'invalid_alarm_time',
            user_id: 'dummy_user_id3'
          },
          {
            device_token: 'dummy_device4',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id4'
          }
        ],
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const result = await alarmRepository.listByAlarmTime(new AlarmTime('0800'));
      expect(result.length).toBe(2);
      expect(result[0].getDevice().getToken()).toBe('dummy_device');
      expect(result[1].getDevice().getToken()).toBe('dummy_device4');
    });
    test('一致するデータがない場合は空の配列を返す', async () => {
      ddbMock.on(libdynamodb.QueryCommand).resolves({
        Items: [],
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const result = await alarmRepository.listByAlarmTime(new AlarmTime('0800'));
      expect(result.length).toBe(0);
    });
    test('ステータスコードが200以外の場合はエラーを投げる', async () => {
      ddbMock.on(libdynamodb.QueryCommand).resolves({
        $metadata: {
          httpStatusCode: 500
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      await expect(async()=>await alarmRepository.listByAlarmTime(new AlarmTime('0800'))).rejects.toThrow(Error);
    });
    test('last_evaluated_keyが存在し、複数回のデータ取得が行われた際に途中でAPIエラーが発生した場合はエラーを投げる', async () => {
      const dummy_table_name = 'dummy_table_name';
      const input_alarm_time = '0800';
      const input_alarm_index = 'alarm_time_index';
      ddbMock.on(QueryCommand, {
        TableName: dummy_table_name,
        IndexName: input_alarm_index,
        KeyConditionExpression: "alarm_time = :alarm_time",
        ExpressionAttributeValues: {
          ":alarm_time": input_alarm_time
        }
      }).resolves({
        Items: [
          {
            device_token: 'dummy_device',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id'
          },
          {
            device_token: 'dummy_device2',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id2'
          }
        ],
        LastEvaluatedKey: {
          device_token: 'dummy_device2'
        },
        $metadata: {
          httpStatusCode: 200
        }
      }).on(QueryCommand,{
        TableName: dummy_table_name,
        IndexName: input_alarm_index,
        KeyConditionExpression: "alarm_time = :alarm_time",
        ExpressionAttributeValues: {
          ":alarm_time": input_alarm_time
        },
        ExclusiveStartKey: {
          device_token: 'dummy_device2'
        }
      }).resolves({
        $metadata: {
          httpStatusCode: 500
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, dummy_table_name);
      await expect(async()=>await alarmRepository.listByAlarmTime(new AlarmTime('0800'))).rejects.toThrow(Error);
    });
  });
  describe('save', () => {
    test('should return true', async () => {
      ddbMock.on(libdynamodb.PutCommand).resolves({
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const result = await alarmRepository.save(new Alarm(new Device('dummy_device_token', 'ios'),new AlarmTime('0800'),new User('dummy_user_id')));
      expect(result).toBe(true);
    });
    test('ステータスコードが200以外の場合はエラーを投げる', async () => {
      ddbMock.on(libdynamodb.PutCommand).resolves({
        $metadata: {
          httpStatusCode: 500
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      await expect(async()=>await alarmRepository.save(new Alarm(new Device('dummy_device_token', 'ios'),new AlarmTime('0800'),new User('dummy_user_id')))).rejects.toThrow(Error);
    });
  });
  describe('delete', () => {
    test('should return true', async () => {
      ddbMock.on(libdynamodb.DeleteCommand).resolves({
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const result = await alarmRepository.delete(new Alarm(new Device('dummy_device_token', 'ios'),new AlarmTime('0800'),new User('dummy_user_id')));
      expect(result).toBe(true);
    });
    test('ステータスコードが200以外の場合はエラーを投げる', async () => {
      ddbMock.on(libdynamodb.DeleteCommand).resolves({
        $metadata: {
          httpStatusCode: 500
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      await expect(async()=>await alarmRepository.delete(new Alarm(new Device('dummy_device_token', 'ios'),new AlarmTime('0800'),new User('dummy_user_id')))).rejects.toThrow(Error);
    });
  });
});