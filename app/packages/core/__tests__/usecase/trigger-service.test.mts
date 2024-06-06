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
import { AlarmHistory } from '../../src/entity/alarm-history.mjs';

describe('sendMessage', () => {
  const date_constructor = global.Date;
  beforeEach(() => {
    // Dateのコンストラクタをモック化
    global.Date = jest.fn(() => new date_constructor("2024-03-17T00:00:00.000Z")) as any;

    // Date.now()をモック化
    global.Date.now = jest.fn(() => new Date("2024-03-17T00:00:00.000Z").getTime()) as any;
  });
  afterEach(() => {
    global.Date = date_constructor;
  });

  test('1件のデバイスに対して1つのゴミ', async () => {
    const trash_schedule_repository: TrashScheduleRepository = {
      findTrashScheduleByUserId: jest.fn(async(user_id: string)=>(
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
      ))
    };
    const alarm_repository: AlarmRepository = {
      save: jest.fn().mockReturnValue(true) as any,
      saveAll: jest.fn() as any,
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
      sendToDevices: jest.fn(async(deviceMessages: DeviceMessage[]) => [
      {
        status: NotificationStatus.SUCCESS,
        deviceToken: "aiueo",
        sendMessage: "もえるゴミ"
      }])
    };
    await sendMessage(trash_schedule_repository, alarm_repository, message_sender, new AlarmTime("1201"));

    expect(alarm_repository.listByAlarmTime).toBeCalledWith({hour:12, minute:1});
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledTimes(1);
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledWith("test");
    expect(message_sender.sendToDevices).toBeCalledWith([new DeviceMessage(new Device("aiueo", "ios"), "もえるゴミ")]);
    // メッセージ送信成功日時が更新されていること
    const saved_arguments = (alarm_repository.saveAll as jest.Mock).mock.calls[0][0] as Alarm[];
    expect(alarm_repository.saveAll).toBeCalledTimes(1);
    expect(saved_arguments[0].alarmHistory.last_successful_time).toEqual(new Date("2024-03-17T00:00:00Z"));
    // 送信成功日時以外の情報は更新されていないこと
    expect(saved_arguments[0].device).toEqual(new Device("aiueo", "ios"));
    expect(saved_arguments[0].alarmTime).toEqual(new AlarmTime("1201"));
    expect(saved_arguments[0].user).toEqual(new User("test"));
    expect(saved_arguments[0].alarmHistory.created_at).toEqual(new Date("2024-03-17T00:00:00Z"));
    expect(saved_arguments[0].alarmHistory.last_failed_time).toBeUndefined();
  });
  test("1件のデバイスに対して複数のゴミ", async () => {
    const trash_schedule_repository: TrashScheduleRepository = {
      findTrashScheduleByUserId: jest.fn(async (user_id: string) => (
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
      ))
    };
    const alarm_repository: AlarmRepository = {
      save: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      saveAll: jest.fn() as any,
      delete: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      findByDeviceToken: function (deviceToken: string): Promise<Alarm | null> {
        throw new Error('Function not implemented.');
      },
      listByAlarmTime: jest.fn().mockReturnValue([
        new Alarm(new Device("aiueo", "ios"), new AlarmTime({hour: 0, minute: 0}), new User("test"),
        new AlarmHistory(new Date("2024-02-17T00:00:00.000Z"), {last_successful_time: new Date("2024-02-18T00:00:00.000Z")}))
      ]) as any
    };
    const message_sender: MessageSender = {
      sendToDevices: jest.fn(async(deviceMessages: DeviceMessage[]) => [
      {
        status: NotificationStatus.SUCCESS,
        deviceToken: "aiueo",
        sendMessage: "もえるゴミ,プラスチック"
      }])
    };
    await sendMessage(trash_schedule_repository, alarm_repository, message_sender, new AlarmTime("0000"));

    expect(alarm_repository.listByAlarmTime).toBeCalledWith({hour:0 ,minute: 0});
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledTimes(1);
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledWith("test");
    expect(message_sender.sendToDevices).toBeCalledWith([new DeviceMessage(new Device("aiueo", "ios"), "もえるゴミ,プラスチック")]);

    // メッセージ送信成功日時が更新されていること(created_at, last_successful_timeより後の日付であること)
    const saved_arguments = (alarm_repository.saveAll as jest.Mock).mock.calls[0][0] as Alarm[];
    expect(alarm_repository.saveAll).toBeCalledTimes(1);
    expect(saved_arguments[0].alarmHistory.last_successful_time?.toISOString()).toBe(new Date("2024-03-17T:00:00:00.000Z").toISOString());
    // 送信成功日時以外の情報は更新されていないこと
    expect(saved_arguments[0].device).toEqual(new Device("aiueo", "ios"));
    expect(saved_arguments[0].alarmTime).toEqual(new AlarmTime("0000"));
    expect(saved_arguments[0].user).toEqual(new User("test"));
    expect(saved_arguments[0].alarmHistory.created_at).toEqual(new Date("2024-02-17T00:00:00Z"));
    expect(saved_arguments[0].alarmHistory.last_failed_time).toBeUndefined();
  });
  test("1件のデバイスに対して今日出せるゴミがない", async () => {
    const trash_schedule_repository: TrashScheduleRepository = {
      findTrashScheduleByUserId: jest.fn(async (user_id: string) => (
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
      ))
    };
    const alarm_repository: AlarmRepository = {
      save: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      saveAll: jest.fn() as any,
      delete: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      findByDeviceToken: function (deviceToken: string): Promise<Alarm | null> {
        throw new Error('Function not implemented.');
      },
      listByAlarmTime: jest.fn().mockReturnValue([
        new Alarm(new Device("aiueo", "ios"), new AlarmTime({hour: 23, minute: 59}), new User("test"), new AlarmHistory(new Date("2024-02-17T00:00:00.000Z"), {last_successful_time: new Date("2024-02-18T00:00:00.000Z"), last_failed_time: new Date("2024-02-19T00:00:00.000Z")}))
      ]) as any
    };
    const message_sender: MessageSender = {
      sendToDevices: jest.fn(async(deviceMessages: DeviceMessage[]) => [
      {
        status: NotificationStatus.SUCCESS,
        deviceToken: "aiueo",
        sendMessage: "今日出せるゴミはありません"
      }])
    };
    await sendMessage(trash_schedule_repository, alarm_repository, message_sender, new AlarmTime("2359"));

    expect(alarm_repository.listByAlarmTime).toBeCalledWith({hour:23 ,minute: 59});
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledTimes(1);
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledWith("test");
    expect(message_sender.sendToDevices).toBeCalledWith([new DeviceMessage(new Device("aiueo", "ios"), "今日出せるゴミはありません")]);

    // メッセージ送信成功日時が更新されていること(created_at, last_successful_timeより後の日付であること)
    const saved_arguments = (alarm_repository.saveAll as jest.Mock).mock.calls[0][0] as Alarm[];
    expect(alarm_repository.saveAll).toBeCalledTimes(1);
    expect(saved_arguments[0].alarmHistory.last_successful_time?.toISOString()).toBe(new Date("2024-03-17T:00:00:00.000Z").toISOString());
    // 送信成功日時以外の情報は更新されていないこと
    expect(saved_arguments[0].device).toEqual(new Device("aiueo", "ios"));
    expect(saved_arguments[0].alarmTime).toEqual(new AlarmTime("2359"));
    expect(saved_arguments[0].user).toEqual(new User("test"));
    expect(saved_arguments[0].alarmHistory.created_at).toEqual(new Date("2024-02-17T00:00:00Z"));
    expect(saved_arguments[0].alarmHistory.last_failed_time?.toISOString()).toBe(new Date("2024-02-19T00:00:00.000Z").toISOString());
  });
  test("複数のデバイス", async () => {
    const trash_schedule_repository: TrashScheduleRepository = {
      findTrashScheduleByUserId: jest.fn(async (user_id: string)=> {
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
        } else {
          return null;
        }
      })
    };
    const alarm_repository: AlarmRepository = {
      save: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      saveAll: jest.fn() as any,
      delete: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      findByDeviceToken: function (deviceToken: string): Promise<Alarm | null> {
        throw new Error('Function not implemented.');
      },
      listByAlarmTime: jest.fn().mockReturnValue([
        new Alarm(new Device("aiueo", "ios"), new AlarmTime({hour: 0, minute: 0}), new User("test1"), new AlarmHistory(new Date("2024-02-17T00:00:00.000Z"), {last_successful_time: new Date("2024-02-18T00:00:00.000Z"), last_failed_time: new Date("2024-02-19T00:00:00.000Z")})),
        new Alarm(new Device("kakikukeko", "ios"), new AlarmTime({hour: 0, minute: 0}), new User("test2"), new AlarmHistory(new Date("2024-02-17T23:00:00.000Z")))
      ]) as any
    };
    const message_sender: MessageSender = {
      sendToDevices: jest.fn(async(deviceMessages: DeviceMessage[]) => [
      {
        status: NotificationStatus.SUCCESS,
        deviceToken: "aiueo",
        sendMessage: "もえるゴミ,その他"
      },
      {
        status: NotificationStatus.SUCCESS,
        deviceToken: "kakikukeko",
        sendMessage: "今日出せるゴミはありません"
      }])
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

    // 2件のデバイスに対して送信成功日時が更新されていること(created_at, last_successful_timeより後の日付であること)
    const saved_arguments = (alarm_repository.saveAll as jest.Mock).mock.calls[0][0] as Alarm[];
    expect(alarm_repository.saveAll).toBeCalledTimes(1);
    expect(saved_arguments[0].alarmHistory.last_successful_time?.toISOString()).toBe(new Date("2024-03-17T:00:00:00.000Z").toISOString());
    expect(saved_arguments[1].alarmHistory.last_successful_time?.toISOString()).toBe(new Date("2024-03-17T:00:00:00.000Z").toISOString());
    // 送信成功日時以外の情報は更新されていないこと
    expect(saved_arguments[0].device).toEqual(new Device("aiueo", "ios"));
    expect(saved_arguments[0].alarmTime).toEqual(new AlarmTime("0000"));
    expect(saved_arguments[0].user).toEqual(new User("test1"));
    expect(saved_arguments[0].alarmHistory.created_at).toEqual(new Date("2024-02-17T00:00:00.000Z"));
    expect(saved_arguments[0].alarmHistory.last_failed_time?.toISOString()).toBe(new Date("2024-02-19T00:00:00.000Z").toISOString());
    expect(saved_arguments[1].device).toEqual(new Device("kakikukeko", "ios"));
    expect(saved_arguments[1].alarmTime).toEqual(new AlarmTime("0000"));
    expect(saved_arguments[1].user).toEqual(new User("test2"));
    expect(saved_arguments[1].alarmHistory.created_at).toEqual(new Date("2024-02-17T23:00:00.000Z"));
    expect(saved_arguments[1].alarmHistory.last_failed_time).toBeUndefined();
  });
  test("対象の時間帯に登録されているデバイストークンが無い場合は何もせずに処理を終了する", async () => {
    const trash_schedule_repository: TrashScheduleRepository = {
      findTrashScheduleByUserId: jest.fn(async (user_id: string) => null)
    };
    const alarm_repository: AlarmRepository = {
      save: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      saveAll: jest.fn() as any,
      delete: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      findByDeviceToken: function (deviceToken: string): Promise<Alarm | null> {
        throw new Error('Function not implemented.');
      },
      listByAlarmTime: jest.fn().mockReturnValue([]) as any
    };
    const message_sender: MessageSender = {
      sendToDevices: jest.fn().mockReturnValue([]) as any
    };
    await sendMessage(trash_schedule_repository, alarm_repository, message_sender, new AlarmTime("0000"));

    expect(alarm_repository.listByAlarmTime).toBeCalledWith({hour:0 ,minute: 0});
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledTimes(0);
    expect(message_sender.sendToDevices).toBeCalledTimes(0);

    // saveAllが呼ばれていないこと
    expect(alarm_repository.saveAll).toBeCalledTimes(0);
  });
  test("デバイストークンの登録が1件以上であるにも関わらず、ゴミ出しスケジュールが見つからない場合はエラーを投げる", async () => {
    const date_constructor = global.Date;
    global.Date = jest.fn(() => new date_constructor("2024-03-17T00:00:00Z")) as any;

    const trash_schedule_repository: TrashScheduleRepository = {
      findTrashScheduleByUserId: jest.fn(async(user_id: string)=>(null))
    };
    const alarm_repository: AlarmRepository = {
      save: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      saveAll: jest.fn() as any,
      delete: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      findByDeviceToken: function (deviceToken: string): Promise<Alarm | null> {
        throw new Error('Function not implemented.');
      },
      listByAlarmTime: jest.fn().mockReturnValue([
        new Alarm(new Device("aiueo", "ios"), new AlarmTime({hour: 0, minute: 0}), new User("zero-schedule-user"))
      ]) as any
    };

    await expect(async ()=> {await sendMessage(trash_schedule_repository, alarm_repository, {} as MessageSender, new AlarmTime("0000"))}).rejects.toThrow(Error);

    expect(alarm_repository.listByAlarmTime).toBeCalledWith({hour:0 ,minute: 0});

    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledTimes(1);
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledWith("zero-schedule-user");
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
      })
    };

    const alarm_repository: AlarmRepository = {
      save: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      saveAll: jest.fn() as any,
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
      sendToDevices: jest.fn(async(deviceMessaages: DeviceMessage[]) => (
        [
          {
            status: NotificationStatus.SUCCESS,
            deviceToken: "test1",
            sendMessage: "もえるゴミ"
          }
        ]
      ))
    };

    await sendMessage(trash_schedule_repository, alarm_repository, message_sender, new AlarmTime("0000"));

    expect(alarm_repository.listByAlarmTime).toBeCalledWith({hour:0 ,minute: 0});
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledTimes(2);
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledWith("test1");
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledWith("test2");
    expect(message_sender.sendToDevices).toBeCalledWith([
      new DeviceMessage(new Device("test1", "ios"), "もえるゴミ")]);
  });
  test('送信対象デバイスが500台を超える場合、500台ずつ送信する', async () => {
    const test_user_ids = Array.from({length: 1000}, (_, i) => `test${i}`);
    const trash_schedule_repository: TrashScheduleRepository = {
      findTrashScheduleByUserId: jest.fn(async(user_id: string)=>(
        {
          trashData: [
            {
              type: "other",
              schedules: [
                {
                  type: "weekday",
                  value: "0"
                }
              ],
              trash_val: `ゴミ_${user_id}`
            }
          ]
        } as TrashSchedule
      ))
    };
    const alarm_repository: AlarmRepository = {
      save: jest.fn().mockReturnValue(true) as any,
      saveAll: jest.fn() as any,
      delete: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      findByDeviceToken: function (deviceToken: string): Promise<Alarm | null> {
        throw new Error('Function not implemented.');
      },
      listByAlarmTime: jest.fn().mockReturnValue(
        test_user_ids.map((user_id) => new Alarm(new Device(`device_${user_id}`, "ios"), new AlarmTime({hour: 12, minute: 1}), new User(user_id), new AlarmHistory(new Date("2024-02-17T00:00:00.000Z"))))
      ) as any
    };
    const message_sender: MessageSender = {
      sendToDevices: jest.fn(async(deviceMessages: DeviceMessage[]) => (
        deviceMessages.map((deviceMessage) => (
          {
            status: NotificationStatus.SUCCESS,
            deviceToken: deviceMessage.device.getToken(),
            sendMessage: deviceMessage.message
          }
        ))
      ))
    };
    await sendMessage(trash_schedule_repository, alarm_repository, message_sender, new AlarmTime("1201"));

    expect(alarm_repository.listByAlarmTime).toBeCalledWith({hour:12, minute:1});
    expect(trash_schedule_repository.findTrashScheduleByUserId).toBeCalledTimes(1000);
    expect(message_sender.sendToDevices).toBeCalledTimes(2);
    expect(message_sender.sendToDevices).toBeCalledWith(Array.from({length: 500}, (_, i) => new DeviceMessage(new Device(`device_${test_user_ids[i]}`, "ios"), `ゴミ_${test_user_ids[i]}`)));
    expect(message_sender.sendToDevices).toBeCalledWith(Array.from({length: 500}, (_, i) => new DeviceMessage(new Device(`device_${test_user_ids[500+i]}`, "ios"), `ゴミ_${test_user_ids[i+500]}`)));

    // 一応個別の引数も期待値との一致を確認
    const first_sendto_devices_arguments = (message_sender.sendToDevices as jest.Mock).mock.calls[0][0] as DeviceMessage[];
    first_sendto_devices_arguments.forEach((deviceMessage, index) => {
      expect(deviceMessage.device.getToken()).toBe(`device_${test_user_ids[index]}`);
      expect(deviceMessage.message).toBe(`ゴミ_${test_user_ids[index]}`);
    });
    const second_sendto_devices_arguments = (message_sender.sendToDevices as jest.Mock).mock.calls[1][0] as DeviceMessage[];
    second_sendto_devices_arguments.forEach((deviceMessage, index) => {
      expect(deviceMessage.device.getToken()).toBe(`device_${test_user_ids[index+500]}`);
      expect(deviceMessage.message).toBe(`ゴミ_${test_user_ids[index+500]}`);
    });

    // 履歴保存のためのリポジトリは一括呼び出しされること
    const saved_arguments = (alarm_repository.saveAll as jest.Mock).mock.calls[0][0] as Alarm[];
    expect(alarm_repository.saveAll).toBeCalledTimes(1);
    expect(saved_arguments.length).toBe(1000);
    saved_arguments.forEach((alarm, index) => {
      expect(alarm.device.getToken()).toBe(`device_${test_user_ids[index]}`);
      expect(alarm.alarmTime).toEqual(new AlarmTime("1201"));
      expect(alarm.user).toEqual(new User(test_user_ids[index]));
      expect(alarm.alarmHistory.created_at).toEqual(new Date("2024-02-17T00:00:00Z"));
      expect(alarm.alarmHistory.last_successful_time).toEqual(new Date("2024-03-17T00:00:00Z"));
      expect(alarm.alarmHistory.last_failed_time).toBeUndefined();
    });
  });
  test('送信対象が複数の場合にスケジュールの取得に失敗した場合でも、他のデバイスに対してはメッセージを送信する', async () => {
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
          throw new Error("findTrashScheduleByUserId error");
        }
      })
    };
    const alarm_repository: AlarmRepository = {
      save: jest.fn().mockReturnValue(true) as any,
      saveAll: jest.fn() as any,
      delete: function (alarm: Alarm): Promise<boolean> {
        throw new Error('Function not implemented.');
      },
      findByDeviceToken: function (deviceToken: string): Promise<Alarm | null> {
        throw new Error('Function not implemented.');
      },
      listByAlarmTime: jest.fn().mockReturnValue([
        new Alarm(new Device("device1", "ios"), new AlarmTime({hour: 0, minute: 0}), new User("test1")),
        new Alarm(new Device("device2", "ios"), new AlarmTime({hour: 0, minute: 0}), new User("test2"))
      ]) as any
    };
    const message_sender: MessageSender = {
      sendToDevices: jest.fn(async(deviceMessages: DeviceMessage[]) => (
        deviceMessages.map((deviceMessage) => (
          {
            status: NotificationStatus.SUCCESS,
            deviceToken: deviceMessage.device.getToken(),
            sendMessage: deviceMessage.message
          }
        ))
      ))
    };
    await sendMessage(trash_schedule_repository, alarm_repository, message_sender, new AlarmTime("0000"));

    expect(message_sender.sendToDevices).toBeCalledWith([
      new DeviceMessage(new Device("device1", "ios"), "もえるゴミ")]);
  });
});