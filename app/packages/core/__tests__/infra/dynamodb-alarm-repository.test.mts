import { describe, test, expect, jest } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import  libdynamodb, { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Alarm, AlarmTime } from '../../src/entity/alarm.mjs';

const ddbMock = mockClient(DynamoDBDocumentClient);
import { DynamoDBAlarmRepository } from '../../src/infra/dynamodb-alarm-repository.mjs';
import { User } from '../../src/entity/user.mjs';
import { Device } from '../../src/entity/device.mjs';
import { AlarmHistory } from '../../src/entity/alarm-history.mjs';
describe('DynamoDBAlarmRepository', () => {
  describe('findByDeviceToken', () => {
    beforeEach(() => {
      ddbMock.reset();
    });
    test('正常にデータが取得できること', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          device_token: 'dummy_device_token',
          platform: 'ios',
          alarm_time: '0800',
          user_id: 'dummy_user_id',
          created_at: '2022-01-01T00:00:00.000Z'
        },
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const result = await alarmRepository.findByDeviceToken('dummy_device_token');
      expect(result?.device.getToken()).toBe('dummy_device_token');
      expect(result?.device.getPlatform()).toBe('ios');
      expect(result?.user.getId()).toBe('dummy_user_id');
      expect(result?.alarmTime).toEqual(new AlarmTime('0800'));
      expect(result?.alarmHistory.created_at.toISOString()).toEqual('2022-01-01T00:00:00.000Z');
      expect(result?.alarmHistory.last_successful_time).toBeUndefined();
      expect(result?.alarmHistory.last_failed_time).toBeUndefined();
    });
    test('DB上のlast_successful_time,last_failed_timeが存在する場合は戻り値に値が設定されること。', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          device_token: 'dummy_device_token',
          platform: 'ios',
          alarm_time: '0800',
          user_id: 'dummy_user_id',
          created_at: '2021-01-01T00:00:00.000Z',
          last_successful_time: '2022-01-01T00:00:00.000Z',
          last_failed_time: '2023-01-01T00:00:00.000Z'
        },
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const result = await alarmRepository.findByDeviceToken('dummy_device_token');
      expect(result?.alarmHistory.created_at.toISOString()).toEqual('2021-01-01T00:00:00.000Z');
      expect(result?.alarmHistory.last_successful_time?.toISOString()).toEqual('2022-01-01T00:00:00.000Z');
      expect(result?.alarmHistory.last_failed_time?.toISOString()).toEqual('2023-01-01T00:00:00.000Z');
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
            user_id: 'dummy_user_id',
            created_at: '2022-01-01T00:00:00.000Z',
          }
        ],
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const result = await alarmRepository.listByAlarmTime(new AlarmTime('0800'));
      expect(result[0].alarmTime).toEqual(new AlarmTime('0800'));
    });
    test('2件のデータ取得', async () => {
      ddbMock.on(libdynamodb.QueryCommand).resolves({
        Items: [
          {
            device_token: 'dummy_device',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id',
            created_at: '2022-01-01T00:00:00.000Z',
            last_successful_time: '2022-12-01T00:00:00.000Z',
          },
          {
            device_token: 'dummy_device2',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id2',
            created_at: '2022-02-01T00:00:00.000Z',
            last_failed_time: '2023-12-01T00:00:00.000Z',
          }
        ],
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const result = await alarmRepository.listByAlarmTime(new AlarmTime('0800'));
      expect(result.length).toBe(2);
      expect(result[0].device.getToken()).toBe('dummy_device');
      expect(result[0].device.getPlatform()).toBe('ios');
      expect(result[0].user.getId()).toBe('dummy_user_id');
      expect(result[0].alarmTime).toEqual(new AlarmTime('0800'));
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
            user_id: 'dummy_user_id',
            created_at: '2022-01-01T00:00:00.000Z',
          },
          {
            device_token: 'dummy_device2',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id2',
            created_at: '2022-01-01T00:00:00.000Z',
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
            user_id: 'dummy_user_id_3',
            created_at: '2022-01-01T00:00:00.000Z',
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
      expect(result[0].device.getToken()).toBe('dummy_device');
      expect(result[1].device.getToken()).toBe('dummy_device2');
      expect(result[2].device.getToken()).toBe('dummy_device_3');
      expect(ddbMock.calls().length).toBe(2);
    });
    test('複数のデータが存在する場合に不正なデータが含まれている場合は当該のデータを除外して取得する', async () => {
      ddbMock.on(libdynamodb.QueryCommand).resolves({
        Items: [
          {
            device_token: 'dummy_device',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id',
            created_at: '2022-01-01T00:00:00.000Z',
          },
          {
            device_token: 'dummy_device2',
            platform: 'invalid_platform',
            alarm_time: '0800',
            user_id: 'dummy_user_id2',
            created_at: '2022-01-01T00:00:00.000Z',
          },
          {
            device_token: 'dummy_device3',
            platform: 'ios',
            alarm_time: 'invalid_alarm_time',
            user_id: 'dummy_user_id3',
            created_at: '2022-01-01T00:00:00.000Z',
          },
          {
            device_token: 'dummy_device4',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id4',
            created_at: '2022-01-01T00:00:00.000Z',
          }
        ],
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const result = await alarmRepository.listByAlarmTime(new AlarmTime('0800'));
      expect(result.length).toBe(2);
      expect(result[0].device.getToken()).toBe('dummy_device');
      expect(result[1].device.getToken()).toBe('dummy_device4');
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
            user_id: 'dummy_user_id',
            created_at: '2022-01-01T00:00:00.000Z',
          },
          {
            device_token: 'dummy_device2',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id2',
            created_at: '2022-01-01T00:00:00.000Z',
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
    test('created_at指定無しの場合は現在時刻でデータが保存されること', async () => {
      const date_constructor = global.Date;
      try {
        global.Date = jest.fn(() => new date_constructor('2022-01-01T00:00:00.000Z')) as any;
        ddbMock.on(libdynamodb.PutCommand, {
          TableName: 'dummy_table_name',
          Item: {
            device_token: 'dummy_device_token',
            platform: 'ios',
            alarm_time: '0800',
            user_id: 'dummy_user_id',
            created_at: '2022-01-01T00:00:00.000Z'
          }
        }).resolves({
          $metadata: {
            httpStatusCode: 200
          }
        });
        const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
        const result = await alarmRepository.save(new Alarm(new Device('dummy_device_token', 'ios'),new AlarmTime('0800'),new User('dummy_user_id')));
        expect(result).toBe(true);
      } finally {
        global.Date = date_constructor;
      }
    });
    test('last_successful_time,last_failed_timeが指定されている場合はその時間でデータが保存されること', async () => {
      ddbMock.on(libdynamodb.PutCommand, {
        TableName: 'dummy_table_name',
        Item: {
          device_token: 'dummy_device',
          platform: 'ios',
          alarm_time: '0800',
          user_id: 'dummy_user_id',
          created_at: '2022-01-01T00:00:00.000Z',
          last_successful_time: '2022-01-01T00:00:00.000Z',
          last_failed_time: '2023-01-01T00:00:00.000Z'
        }
      }).resolves({
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const result = await alarmRepository.save(new Alarm(new Device('dummy_device', 'ios'),new AlarmTime('0800'),new User('dummy_user_id'), new AlarmHistory(new Date('2022-01-01T00:00:00.000Z'), {last_successful_time: new Date('2022-01-01T00:00:00.000Z'), last_failed_time: new Date('2023-01-01T00:00:00.000Z')})));
      expect(result).toBe(true);
    });
    test('created_at指定有りの場合は指定時刻でデータが保存されること', async () => {
      ddbMock.on(libdynamodb.PutCommand, {
        TableName: 'dummy_table_name',
        Item: {
          device_token: 'dummy_device',
          platform: 'ios',
          alarm_time: '0800',
          user_id: 'dummy_user_id',
          created_at: '2023-01-01T00:00:00.000Z'
        }
      }).resolves({
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const result = await alarmRepository.save(new Alarm(new Device('dummy_device', 'ios'),new AlarmTime('0800'),new User('dummy_user_id'), new AlarmHistory(new Date('2023-01-01T00:00:00.000Z'))));
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
  describe('saveAll', () => {
    test('25件以下の一括保存が正常に実行されること', async () => {
      ddbMock.on(libdynamodb.BatchWriteCommand, {
        RequestItems: {
          dummy_table_name: [
            {
              PutRequest: {
                Item: {
                  device_token: 'dummy',
                  platform: 'ios',
                  alarm_time: '0800',
                  user_id: 'dummy_user_id',
                  created_at: '2022-01-01T00:00:00.000Z'
                }
              }
            }
          ]
        }
      }).resolves({
        $metadata: {
          httpStatusCode: 200
        }
      });
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      await alarmRepository.saveAll([new Alarm(new Device('dummy_device_token', 'ios'),new AlarmTime('0800'),new User('dummy_user_id'))]);
    });
    test('26件以上の一括保存が正常に実行されること', async () => {
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const alarms = Array.from({length: 26}, (_, i) => new Alarm(new Device(`dummy_device_token_${i}`, 'ios'),new AlarmTime('0800'),new User('dummy_user_id')));
      const first_batch_items = alarms.slice(0, 25).map((alarm) => {
        return {
          PutRequest: {
            Item: {
              device_token: alarm.device.getToken(),
              platform: alarm.device.getPlatform(),
              alarm_time: alarm.alarmTime.formatTimeToHHMM(),
              user_id: alarm.user.getId(),
              created_at: alarm.alarmHistory.created_at.toISOString()
            }
          }
        };
      });
      const second_batch_items = alarms.slice(25).map((alarm) => {
        return {
          PutRequest: {
            Item: {
              device_token: alarm.device.getToken(),
              platform: alarm.device.getPlatform(),
              alarm_time: alarm.alarmTime.formatTimeToHHMM(),
              user_id: alarm.user.getId(),
              created_at: alarm.alarmHistory.created_at.toISOString()
            }
          }
        };
      });

      ddbMock.on(libdynamodb.BatchWriteCommand, {
        RequestItems: {
          dummy_table_name: first_batch_items
        }
      }).resolves({
        $metadata: {
          httpStatusCode: 200
        }
      }).on(libdynamodb.BatchWriteCommand, {
        RequestItems: {
          dummy_table_name: second_batch_items
        }
      }).resolves({
        $metadata: {
          httpStatusCode: 200
        }
      });
      await alarmRepository.saveAll(alarms);
    });
    test('26件以上のデータ保存でAPIエラーが発生した場合でも処理が続行されること', async () => {
      const alarmRepository = new DynamoDBAlarmRepository({}, 'dummy_table_name');
      const alarms = Array.from({length: 26}, (_, i) => new Alarm(new Device(`dummy_device_token_${i}`, 'ios'),new AlarmTime('0800'),new User('dummy_user_id')));
      const first_batch_items = alarms.slice(0, 25).map((alarm) => {
        return {
          PutRequest: {
            Item: {
              device_token: alarm.device.getToken(),
              platform: alarm.device.getPlatform(),
              alarm_time: alarm.alarmTime.formatTimeToHHMM(),
              user_id: alarm.user.getId(),
              created_at: alarm.alarmHistory.created_at.toISOString()
            }
          }
        };
      });
      const second_batch_items = alarms.slice(25).map((alarm) => {
        return {
          PutRequest: {
            Item: {
              device_token: alarm.device.getToken(),
              platform: alarm.device.getPlatform(),
              alarm_time: alarm.alarmTime.formatTimeToHHMM(),
              user_id: alarm.user.getId(),
              created_at: alarm.alarmHistory.created_at.toISOString()
            }
          }
        };
      });

      ddbMock.on(libdynamodb.BatchWriteCommand, {
        RequestItems: {
          dummy_table_name: first_batch_items
        }
      }).resolves({
        $metadata: {
          httpStatusCode: 501
        }
      }).on(libdynamodb.BatchWriteCommand, {
        RequestItems: {
          dummy_table_name: second_batch_items
        }
      }).resolves({
        $metadata: {
          httpStatusCode: 500
        }
      });
      await alarmRepository.saveAll(alarms);
    });
  });
});