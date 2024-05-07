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

describe('sendMessage', () => {
  beforeEach(() => {
    // Dateのコンストラクタをモック化
    const date_constructor = global.Date;
    global.Date = jest.fn(() => new date_constructor("2024-03-17T00:00:00Z")) as any;

    // Date.now()をモック化
    global.Date.now = jest.fn(() => new Date("2024-03-17T00:00:00Z").getTime()) as any;
  });
  test('1件のデバイスに対して1つのゴミ', async () => {
    const trash_schedule_repository: TrashScheduleRepository = {
      findTrashScheduleByUserId: jest.fn().mockReturnValue(
        {
          trashData: [
            {
              type: "burn",
              schedules: [
                {
                  type: "weekday",
                  value: "0"
                }
              ]
            }
          ]
        } as TrashSchedule
      ) as any
    };
    const alarm_repository: AlarmRepository = {
      save: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      delete: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      findByDeviceToken: function (deviceToken: string): Promise<Alarm | null> {
        throw new Error('Function not implemented.');
      },
      listByAlarmTime: jest.fn().mockReturnValue([
        new Alarm(new Device("aiueo", "ios"), new AlarmTime({hour: 12, minute: 1}), new User("test"))
      ]) as any
    };
    const message_sender: MessageSender = {
      sendToDevices: jest.fn().mockReturnValue({status: NotificationStatus.SUCCESS} as NotificationResult) as any
    };
    await sendMessage(trash_schedule_repository, alarm_repository, message_sender, new AlarmTime("1201"));

    expect(alarm_repository.listByAlarmTime).toBeCalledWith({hour:12, minute:1});
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledTimes(1);
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledWith("test");
    expect(message_sender.sendToDevices).toBeCalledWith([new DeviceMessage(new Device("aiueo", "ios"), "もえるゴミ")]);
  });
  test("1件のデバイスに対して複数のゴミ", async () => {
    const trash_schedule_repository: TrashScheduleRepository = {
      findTrashScheduleByUserId: jest.fn().mockReturnValue(
        {
          trashData: [
            {
              type: "burn",
              schedules: [
                {
                  type: "weekday",
                  value: "0"
                }
              ]
            },
            {
              type: "plastic",
              schedules: [
                {
                  type: "weekday",
                  value: "0"
                }
              ]
            }
          ]
        } as TrashSchedule
      ) as any
    };
    const alarm_repository: AlarmRepository = {
      save: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      delete: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      findByDeviceToken: function (deviceToken: string): Promise<Alarm | null> {
        throw new Error('Function not implemented.');
      },
      listByAlarmTime: jest.fn().mockReturnValue([
        new Alarm(new Device("aiueo", "ios"), new AlarmTime({hour: 0, minute: 0}), new User("test"))
      ]) as any
    };
    const message_sender: MessageSender = {
      sendToDevices: jest.fn().mockReturnValue({status: NotificationStatus.SUCCESS} as NotificationResult) as any
    };
    await sendMessage(trash_schedule_repository, alarm_repository, message_sender, new AlarmTime("0000"));

    expect(alarm_repository.listByAlarmTime).toBeCalledWith({hour:0 ,minute: 0});
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledTimes(1);
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledWith("test");
    expect(message_sender.sendToDevices).toBeCalledWith([new DeviceMessage(new Device("aiueo", "ios"), "もえるゴミ,プラスチック")]);
  });
  test("1件のデバイスに対してゴミがない", async () => {
    const trash_schedule_repository: TrashScheduleRepository = {
      findTrashScheduleByUserId: jest.fn().mockReturnValue(
        {
          trashData: [
            {
              type: "burn",
              schedules: [
                {
                  type: "weekday",
                  value: "1"
                }
              ]
            },
            {
              type: "plastic",
              schedules: [
                {
                  type: "weekday",
                  value: "1"
                }
              ]
            }
          ]
        } as TrashSchedule
      ) as any
    };
    const alarm_repository: AlarmRepository = {
      save: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      delete: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      findByDeviceToken: function (deviceToken: string): Promise<Alarm | null> {
        throw new Error('Function not implemented.');
      },
      listByAlarmTime: jest.fn().mockReturnValue([
        new Alarm(new Device("aiueo", "ios"), new AlarmTime({hour: 23, minute: 59}), new User("test"))
      ]) as any
    };
    const message_sender: MessageSender = {
      sendToDevices: jest.fn().mockReturnValue({status: NotificationStatus.SUCCESS} as NotificationResult) as any
    };
    await sendMessage(trash_schedule_repository, alarm_repository, message_sender, new AlarmTime("2359"));

    expect(alarm_repository.listByAlarmTime).toBeCalledWith({hour:23 ,minute: 59});
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledTimes(1);
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledWith("test");
    expect(message_sender.sendToDevices).toBeCalledWith([new DeviceMessage(new Device("aiueo", "ios"), "今日出せるゴミはありません")]);
  });
  test("複数のデバイス", async () => {
    const trash_schedule_repository: TrashScheduleRepository = {
      findTrashScheduleByUserId: jest.fn<(user_id: string)=> TrashSchedule | undefined>().mockImplementation((user_id: string) => {
        if(user_id === "test1") {
          return {
            trashData: [
              {
                type: "burn",
                schedules: [
                  {
                    type: "weekday",
                    value: "0"
                  }
                ]
              },
              {
                type: "other",
                trash_val: "その他",
                schedules: [
                  {
                    type: "weekday",
                    value: "0"
                  }
                ]
              }
            ]
          } as TrashSchedule
        } else if(user_id === "test2") {
          return {
            trashData: [
              {
                type: "plastic",
                schedules: [
                  {
                    type: "weekday",
                    value: "1"
                  }
                ]
              }
            ]
          } as TrashSchedule
        }
      }) as any
    };
    const alarm_repository: AlarmRepository = {
      save: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      delete: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      findByDeviceToken: function (deviceToken: string): Promise<Alarm | null> {
        throw new Error('Function not implemented.');
      },
      listByAlarmTime: jest.fn().mockReturnValue([
        new Alarm(new Device("aiueo", "ios"), new AlarmTime({hour: 0, minute: 0}), new User("test1")),
        new Alarm(new Device("kakikukeko", "ios"), new AlarmTime({hour: 0, minute: 0}), new User("test2"))
      ]) as any
    };
    const message_sender: MessageSender = {
      sendToDevices: jest.fn().mockReturnValue({status: NotificationStatus.SUCCESS} as NotificationResult) as any
    };
    await sendMessage(trash_schedule_repository, alarm_repository, message_sender, new AlarmTime("0000"));

    expect(alarm_repository.listByAlarmTime).toBeCalledWith({hour:0 ,minute: 0});
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledTimes(2);
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledWith("test1");
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledWith("test2");
    expect(message_sender.sendToDevices).toBeCalledWith([
      new DeviceMessage(new Device("aiueo", "ios"), "もえるゴミ,その他"),
      new DeviceMessage(new Device("kakikukeko", "ios"), "今日出せるゴミはありません")
    ]);
  });
  test("対象の時間帯に登録されているデバイストークンが無い場合は何もせずに処理を終了する", async () => {
    const trash_schedule_repository: TrashScheduleRepository = {
      findTrashScheduleByUserId: jest.fn().mockReturnValue(
        {
        }
      ) as any
    };
    const alarm_repository: AlarmRepository = {
      save: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      delete: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      findByDeviceToken: function (deviceToken: string): Promise<Alarm | null> {
        throw new Error('Function not implemented.');
      },
      listByAlarmTime: jest.fn().mockReturnValue([]) as any
    };
    const message_sender: MessageSender = {
      sendToDevices: jest.fn().mockReturnValue({status: NotificationStatus.SUCCESS} as NotificationResult) as any
    };
    await sendMessage(trash_schedule_repository, alarm_repository, message_sender, new AlarmTime("0000"));

    expect(alarm_repository.listByAlarmTime).toBeCalledWith({hour:0 ,minute: 0});
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledTimes(0);
    expect(message_sender.sendToDevices).toBeCalledTimes(0);
  });
  test("デバイストークンの登録が1件以上であるにも関わらず、ゴミ出しスケジュールが見つからない場合はエラーを投げる", async () => {
    const date_constructor = global.Date;
    global.Date = jest.fn(() => new date_constructor("2024-03-17T00:00:00Z")) as any;

    const trash_schedule_repository: TrashScheduleRepository = {
      findTrashScheduleByUserId: jest.fn().mockReturnValue(null) as any
    };
    const alarm_repository: AlarmRepository = {
      save: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      delete: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      findByDeviceToken: function (deviceToken: string): Promise<Alarm | null> {
        throw new Error('Function not implemented.');
      },
      listByAlarmTime: jest.fn().mockReturnValue([
        new Alarm(new Device("aiueo", "ios"), new AlarmTime({hour: 0, minute: 0}), new User("test"))
      ]) as any
    };

    await expect(async ()=> {await sendMessage(trash_schedule_repository, alarm_repository, {} as MessageSender, new AlarmTime("0000"))}).rejects.toThrow(Error);

    expect(alarm_repository.listByAlarmTime).toBeCalledWith({hour:0 ,minute: 0});

    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledTimes(1);
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledWith("test");
  });
  test("デバイストークンの登録数とゴミ出しスケジュールの取得数が一致しない場合でもゴミ出しスケジュールが1件以上ある場合はメッセージを送信する", async () => {
    const trash_schedule_repository: TrashScheduleRepository = {
      findTrashScheduleByUserId: jest.fn(async(user_id: string) => {
        if(user_id === "test1") {
          return {
            trashData: [
              {
                type: "burn",
                schedules: [
                  {
                    type: "weekday",
                    value: "0"
                  }
                ]
              }
            ]
          } as TrashSchedule
        } else {
          return null;
        }
      }) as any
    };

    const alarm_repository: AlarmRepository = {
      save: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      delete: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      findByDeviceToken: function (deviceToken: string): Promise<Alarm | null> {
        throw new Error('Function not implemented.');
      },
      listByAlarmTime: jest.fn().mockReturnValue([
        new Alarm(new Device("test1", "ios"), new AlarmTime({hour: 0, minute: 0}), new User("test1")),
        new Alarm(new Device("test2", "ios"), new AlarmTime({hour: 0, minute: 0}), new User("test2"))
      ]) as any
    };
    const message_sender: MessageSender = {
      sendToDevices: jest.fn().mockReturnValue({status: NotificationStatus.SUCCESS} as NotificationResult) as any
    };

    await sendMessage(trash_schedule_repository, alarm_repository, message_sender, new AlarmTime("0000"));

    expect(alarm_repository.listByAlarmTime).toBeCalledWith({hour:0 ,minute: 0});
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledTimes(2);
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledWith("test1");
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledWith("test2");
    expect(message_sender.sendToDevices).toBeCalledWith([
      new DeviceMessage(new Device("test1", "ios"), "もえるゴミ")]);
  });
});