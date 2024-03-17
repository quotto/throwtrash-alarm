import { describe,test,expect } from '@jest/globals';
import { FCMNotificationSender } from '../../src/infra/fcm-notification-sender.mjs';
import { initializeApp } from 'firebase-admin/app';
import { DeviceMessage } from '../../src/domain/device-message.mts';
import { Device } from '@shared/core/src/domain/device.mjs';

describe('FcmNotificationSender', () => {
  test('sendToDevices', async () => {
      const app = initializeApp();
    const sender = new FCMNotificationSender(app);
    const result = await sender.sendToDevices([new DeviceMessage(new Device('token', 'ios'), 'message')]);
    expect(result).toEqual({ status: 'SUCCESS', errorMessages: [] });
  });
});
