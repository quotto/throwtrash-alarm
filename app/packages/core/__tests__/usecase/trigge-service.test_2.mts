import { jest, describe, test, expect } from '@jest/globals';
import { sendMessage } from '../../src/usecase/trigger-service.mjs';
import { TrashSchedule } from 'trash-common';
import { TrashScheduleRepository } from '../../src/usecase/trash-schedule-repository.mjs';
import { AlarmRepository } from '../../src/usecase/alarm-repository.mjs';
import { AlarmTime } from '../../src/entity/alarm-time.mjs';
import { Alarm } from '../../src/entity/alarm.mjs';
import { Device } from '../../src/entity/device.mjs';
import { User } from '../../src/entity/user.mjs';
import { MessageSender } from '../../src/usecase/message-sender.mjs';
import { NotificationResult, NotificationStatus } from '../../src/entity/notification-result.mjs';
import { DeviceMessage } from '../../src/entity/device-message.mjs';
import { DynamoDBAlarmRepository } from '../../src/infra/dynamodb-alarm-repository.mjs';
import { DynamoDBTrashScheduleRepository } from '../../src/infra/dynamodb-trash-schedule-repository.mjs'
import { FcmSender } from '../../src/infra/fcm-sender.mjs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';

describe('sendMessage', () => {
  test("lt", async () => {
    const app = initializeApp({credential: applicationDefault()});
    await sendMessage(new DynamoDBTrashScheduleRepository({region: "us-west-2"},"TrashSchedule"),new DynamoDBAlarmRepository({}, "throwtrash-alarm"),new FcmSender(app),new AlarmTime("1129"));
    expect(true).toBe(true);
  });
});