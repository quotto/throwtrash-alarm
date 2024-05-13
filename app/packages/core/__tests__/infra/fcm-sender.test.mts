import { jest } from '@jest/globals';
import type { App } from 'firebase-admin/app';
import type { Message, TokenMessage, SendResponse } from 'firebase-admin/messaging';
jest.unstable_mockModule('firebase-admin/app', () => {
  return {
    initializeApp: jest.fn(() => {
      return { };
    }),
    applicationDefault: jest.fn(() => {
      return {};
    })
  };
});

// ESMで書かれたコードのモジュールをモックするにはawait import前にjest.unstable_mockModuleeが必要になるため、モック関数の中でテストに必要なレスポンスの切り替えを行う。
jest.unstable_mockModule('firebase-admin/messaging', () => {
  return {
    getMessaging: jest.fn((app: App) => {
      return {
            sendEach: jest.fn((_message: TokenMessage[], _dryRun?: boolean) => {
              const responses: SendResponse[] = [];
              let failureCount = 0;
              let successCount = 0;
              _message.forEach(m => {
                if(m.token === 'error-token') {
                  responses.push({ success: false, messageId: 'error-message-id', error: { code: 'error-code-001', message: 'error-message', toJSON: ()=>({}) } });
                  failureCount++;
                } else if(m.token === 'reject-token') {
                  throw new Error('error-message');
                } else {
                  responses.push({ success: true });
                  successCount++;
                }
              });
              return Promise.resolve({ failureCount: failureCount, responses: responses, successCount: successCount });
            })
      };
    })
  };
});

const { FcmSender } = await import('../../src/infra/fcm-sender.mjs');
const { Device } = await import('../../src/entity/device.mjs');
import { DeviceMessage } from '../../src/entity/device-message.mjs';
import { NotificationStatus } from '../../src/entity/notification-result.mjs';
const { initializeApp } = await import('firebase-admin/app');

describe('FcmSender', () => {
  describe('sendToDevices', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.mock('firebase-admin');
    });
    test('1件のメッセージが正常に送信できること', async () => {
      const sender = new FcmSender(initializeApp());
      const deviceMessages:  DeviceMessage[] = [
        new DeviceMessage(new Device('test-token', 'ios'), 'test-message'),
      ];
      const result = await sender.sendToDevices(deviceMessages);
      expect(result.length).toBe(1);
      expect(result[0].status).toBe(NotificationStatus.SUCCESS);
      expect(result[0].deviceToken).toBe('test-token');
      expect(result[0].sendMessage).toBe('test-message');
      expect(result[0].errorMessage).toBeUndefined();
    });
    test('2件のメッセージが正常に送信できること', async () => {
      const sender = new FcmSender(initializeApp());
      const deviceMessages:  DeviceMessage[] = [
        new DeviceMessage(new Device('test-token', 'ios'), 'test-message'),
        new DeviceMessage(new Device('test-token2', 'ios'), 'test-message2'),
      ];
      const result = await sender.sendToDevices(deviceMessages);
      expect(result.length).toBe(2);
      expect(result[0].status).toBe(NotificationStatus.SUCCESS);
      expect(result[0].deviceToken).toBe('test-token');
      expect(result[0].sendMessage).toBe('test-message');
      expect(result[0].errorMessage).toBeUndefined();
      expect(result[1].status).toBe(NotificationStatus.SUCCESS);
      expect(result[1].deviceToken).toBe('test-token2');
      expect(result[1].sendMessage).toBe('test-message2');
      expect(result[1].errorMessage).toBeUndefined();
    });
    test('メッセージが無い場合も正常終了すること', async () => {
      const sender = new FcmSender(initializeApp());
      const deviceMessages:  DeviceMessage[] = [];
      const result = await sender.sendToDevices(deviceMessages);
      expect(result.length).toBe(0);
    });
    test('複数のメッセージのうち1件が失敗した場合、レスポンスにエラー情報が含まれること', async ()=>{
      const sender = new FcmSender(initializeApp());
      const deviceMessages:  DeviceMessage[] = [
        new DeviceMessage(new Device('test-token', 'ios'), 'test-message'),
        new DeviceMessage(new Device('error-token', 'ios'), 'error-message'),
        new DeviceMessage(new Device('test-token2', 'ios'), 'test-message2'),
      ];
      const result = await sender.sendToDevices(deviceMessages);
      expect(result.length).toBe(3);
      expect(result[0].status).toBe(NotificationStatus.SUCCESS);
      expect(result[0].deviceToken).toBe('test-token');
      expect(result[0].sendMessage).toBe('test-message');
      expect(result[0].errorMessage).toBeUndefined();
      expect(result[1].status).toBe(NotificationStatus.FAILURE);
      expect(result[1].deviceToken).toBe('error-token');
      expect(result[1].sendMessage).toBe('error-message');
      expect(result[1].errorMessage).toBe('error-message');
      expect(result[2].status).toBe(NotificationStatus.SUCCESS);
      expect(result[2].deviceToken).toBe('test-token2');
      expect(result[2].sendMessage).toBe('test-message2');
      expect(result[2].errorMessage).toBeUndefined();
    });
    test('複数のメッセージのうち複数件が失敗した場合、レスポンスにエラー情報が含まれること', async ()=>{
      const sender = new FcmSender(initializeApp());
      const deviceMessages:  DeviceMessage[] = [
        new DeviceMessage(new Device('test-token', 'ios'), 'test-message'),
        new DeviceMessage(new Device('error-token', 'ios'), 'error-message'),
        new DeviceMessage(new Device('error-token', 'ios'), 'error-message2'),
        new DeviceMessage(new Device('test-token2', 'ios'), 'test-message2'),
      ];
      const result = await sender.sendToDevices(deviceMessages);
      expect(result.length).toBe(4);
      expect(result[0].status).toBe(NotificationStatus.SUCCESS);
      expect(result[0].deviceToken).toBe('test-token');
      expect(result[0].sendMessage).toBe('test-message');
      expect(result[0].errorMessage).toBeUndefined();
      expect(result[1].status).toBe(NotificationStatus.FAILURE);
      expect(result[1].deviceToken).toBe('error-token');
      expect(result[1].sendMessage).toBe('error-message');
      expect(result[1].errorMessage).toBe('error-message');
      expect(result[2].status).toBe(NotificationStatus.FAILURE);
      expect(result[2].deviceToken).toBe('error-token');
      expect(result[2].sendMessage).toBe('error-message2');
      expect(result[2].errorMessage).toBe('error-message');
      expect(result[3].status).toBe(NotificationStatus.SUCCESS);
      expect(result[3].deviceToken).toBe('test-token2');
      expect(result[3].sendMessage).toBe('test-message2');
      expect(result[3].errorMessage).toBeUndefined();
    });
    test('sendEachで異常終了した場合、エラーが発生すること', async ()=>{
      const sender = new FcmSender(initializeApp());
      const deviceMessages:  DeviceMessage[] = [
        new DeviceMessage(new Device('test-token', 'ios'), 'test-message'),
        new DeviceMessage(new Device('reject-token', 'ios'), 'reject-message'),
        new DeviceMessage(new Device('test-token2', 'ios'), 'test-message2'),
      ];
      await expect(async() => await sender.sendToDevices(deviceMessages)).rejects.toEqual(new Error('error-message'));
    });
  });
});
