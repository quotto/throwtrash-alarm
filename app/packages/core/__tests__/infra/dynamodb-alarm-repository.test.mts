import { describe, test, expect } from '@jest/globals';
import { DynamoDBAlarmRepository } from '../../src/infra/dynamodb-alarm-repository.mjs';
import { AlarmTime } from '../../src/entity/alarm-time.mjs';

describe('first', () => {
    test('listByAlarmTime', async () => {
        const repository = new DynamoDBAlarmRepository({}, "throwtrash-alarm");
        const result = await repository.listByAlarmTime(new AlarmTime({hour: 11,minute: 29}));
        expect(result).toBe(null);
    });
 })
