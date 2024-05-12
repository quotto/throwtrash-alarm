import { describe, test, expect, jest } from '@jest/globals';
import { Alarm, AlarmTime } from "../../src/entity/alarm.mjs";
import { Device } from "../../src/entity/device.mjs";
import { User } from "../../src/entity/user.mjs";
import { AlarmRepository } from "../../src/usecase/alarm-repository.mjs";
import { DeleteError, RegisterError, UpdateError, deleteAlarm, registerAlarm, updateAlarm } from "../../src/usecase/alarm-service.mjs";
import { AlarmScheduler } from "../../src/usecase/alarm-scheduler.mjs";
import { AlarmHistory } from '../../src/entity/alarm-history.mjs';

describe('AlarmService', () => {
    describe('アラームの登録', () => {
        const date_constructor = Date;
        beforeEach(() => {
            global.Date = jest.fn(() => new date_constructor('2024-01-01T00:00:00.000Z')) as any;
        });
        afterEach(() => {
            global.Date = date_constructor;
            jest.clearAllMocks();
        });
        test('正常に登録できること-アラームトリガーが存在しない場合は新規に作成する-AlarmHistoryのcreated_atは現在時刻になる', async () => {
            const mockAlarmRepository: AlarmRepository = jest.mocked<AlarmRepository>({
                save: jest.fn().mockReturnValue(true) as any,
                listByAlarmTime: jest.fn().mockReturnValue([]) as any,
                findByDeviceToken: jest.fn().mockReturnValue(null) as any,
                delete: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmRepository>;

            const mockAlarmTriggerConnector: AlarmScheduler = jest.mocked<AlarmScheduler>({
                findByTime: jest.fn().mockReturnValue(null) as any,
                create: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmScheduler>;

            await registerAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', new AlarmTime({hour: 7,minute: 0}), 'aaaaaa', 'ios');

            expect(mockAlarmTriggerConnector.findByTime).toHaveBeenCalledWith(new AlarmTime({hour: 7, minute: 0}));
            expect(mockAlarmTriggerConnector.create).toHaveBeenCalledWith(new AlarmTime({hour: 7, minute: 0}))
            expect(mockAlarmRepository.save).toHaveBeenCalledTimes(1);
            const save_argument = (mockAlarmRepository.save as jest.Mock).mock.calls[0][0] as Alarm;
            expect(save_argument.device).toEqual(new Device('deviceToken','ios'));
            expect(save_argument.alarmTime).toEqual(new AlarmTime({hour: 7,minute: 0}));
            expect(save_argument.user).toEqual(new User('aaaaaa'));
            expect(save_argument.alarmHistory.created_at.toISOString()).toEqual('2024-01-01T00:00:00.000Z');
            expect(save_argument.alarmHistory.last_successful_time).toBeUndefined();
            expect(save_argument.alarmHistory.last_failed_time).toBeUndefined();
        });
        test('正常に登録できること-アラームトリガーが存在する場合は新規に作成しない', async () => {
            const mockAlarmRepository: AlarmRepository = jest.mocked<AlarmRepository>({
                save: jest.fn().mockReturnValue(true) as any,
                listByAlarmTime: jest.fn().mockReturnValue([]) as any,
                findByDeviceToken: jest.fn().mockReturnValue(null) as any,
                delete: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmRepository>;

            const mockAlarmTriggerConnector: AlarmScheduler = jest.mocked<AlarmScheduler>({
                findByTime: jest.fn().mockReturnValue('alarm-trigger-0700') as any,
                create: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmScheduler>;

            await registerAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', new AlarmTime({hour: 7,minute: 0}), 'aaaaaa', 'ios');

            expect(mockAlarmTriggerConnector.create).not.toHaveBeenCalled();
            expect(mockAlarmRepository.save).toHaveBeenCalledTimes(1);
            const save_argument = (mockAlarmRepository.save as jest.Mock).mock.calls[0][0] as Alarm;
            expect(save_argument.device).toEqual(new Device('deviceToken','ios'));
            expect(save_argument.alarmTime).toEqual(new AlarmTime({hour: 7,minute: 0}));
            expect(save_argument.user).toEqual(new User('aaaaaa'));
            expect(save_argument.alarmHistory.created_at.toISOString()).toEqual('2024-01-01T00:00:00.000Z');
            expect(save_argument.alarmHistory.last_successful_time).toBeUndefined();
            expect(save_argument.alarmHistory.last_failed_time).toBeUndefined();
        });
        test('アラームトリガーの作成に失敗した場合、RegisterErrorが発生すること', async () => {
            const mockAlarmRepository: AlarmRepository = jest.mocked<AlarmRepository>({
                save: jest.fn().mockReturnValue(true) as any,
                listByAlarmTime: jest.fn().mockReturnValue([]) as any,
                findByDeviceToken: jest.fn().mockReturnValue(null) as any,
                delete: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmRepository>;

            const mockAlarmTriggerConnector: AlarmScheduler = jest.mocked<AlarmScheduler>({
                findByTime: jest.fn().mockReturnValue(null) as any,
                create: jest.fn().mockReturnValue(false) as any
            }) as jest.Mocked<AlarmScheduler>;

            await expect(async () => {
                await registerAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', new AlarmTime({hour: 7,minute:0}), 'aaaaaa', 'ios');
            }).rejects.toThrow(RegisterError);
            expect(mockAlarmRepository.save).not.toHaveBeenCalled();
        });
        test('アラームの登録に失敗した場合、RegisterErrorが発生すること', async () => {
            const mockAlarmRepository: AlarmRepository = jest.mocked<AlarmRepository>({
                save: jest.fn().mockReturnValue(false) as any,
                listByAlarmTime: jest.fn().mockReturnValue([]) as any,
                findByDeviceToken: jest.fn().mockReturnValue(null) as any,
                delete: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmRepository>;

            const mockAlarmTriggerConnector: AlarmScheduler = jest.mocked<AlarmScheduler>({
                findByTime: jest.fn().mockReturnValue(null) as any,
                create: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmScheduler>;

            await expect(async () => {
                await registerAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', new AlarmTime({hour: 7,minute:0}), 'aaaaaa', 'ios');
            }).rejects.toThrow(RegisterError);
            expect(mockAlarmTriggerConnector.create).toHaveBeenCalledWith(new AlarmTime({hour: 7, minute: 0}));
        });
    });
    describe('アラームの更新', () => {
        const date_constructor = Date;
        beforeEach(() => {
            global.Date = jest.fn(() => new date_constructor('2024-01-01T00:00:00.000Z')) as any;
        });
        afterEach(() => {
            global.Date = date_constructor;
            jest.clearAllMocks();
        });
        test('正常に更新できること-アラームトリガーが存在しない場合は新規に作成する-alarmTime以外のデータ項目が維持されること', async () => {
            const mockAlarmRepository: AlarmRepository = jest.mocked<AlarmRepository>({
                save: jest.fn().mockReturnValue(true) as any,
                listByAlarmTime: jest.fn().mockReturnValue([]) as any,
                findByDeviceToken: jest.fn().mockReturnValue(new Alarm(new Device('deviceToken','ios'), new AlarmTime({hour: 7,minute:0}), new User('aaaaaa'))) as any,
                delete: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmRepository>;

            const mockAlarmTriggerConnector: AlarmScheduler = jest.mocked<AlarmScheduler>({
                findByTime: jest.fn().mockReturnValue(null) as any,
                create: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmScheduler>;

            await updateAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', new AlarmTime({hour: 6,minute:0}));

            expect(mockAlarmTriggerConnector.create).toHaveBeenCalledWith(new AlarmTime({hour: 6, minute: 0}))
            expect(mockAlarmRepository.save).toHaveBeenCalledTimes(1);
            const save_argument = (mockAlarmRepository.save as jest.Mock).mock.calls[0][0] as Alarm;
            expect(save_argument.device).toEqual(new Device('deviceToken','ios'));
            expect(save_argument.alarmTime).toEqual(new AlarmTime({hour: 6,minute: 0}));
            expect(save_argument.user).toEqual(new User('aaaaaa'));
            expect(save_argument.alarmHistory.created_at.toISOString()).toEqual('2024-01-01T00:00:00.000Z');
            expect(save_argument.alarmHistory.last_successful_time).toBeUndefined();
            expect(save_argument.alarmHistory.last_failed_time).toBeUndefined();
        });
        test("正常に更新できること-アラームトリガーが存在する場合は新規に作成しない-alarmTime以外のデータ項目は維持されること", async () => {
            // テストのためDateのモックを解除
            global.Date = date_constructor;
            const mockAlarmRepository: AlarmRepository = jest.mocked<AlarmRepository>({
                save: jest.fn().mockReturnValue(true) as any,
                listByAlarmTime: jest.fn().mockReturnValue([]) as any,
                findByDeviceToken: jest.fn().mockReturnValue(new Alarm(
                    new Device('deviceToken','ios'),
                    new AlarmTime({hour: 6,minute:0}),
                    new User('aaaaaa'),
                    new AlarmHistory(
                        new Date('2024-02-01T00:00:00.000Z'),
                        {
                            last_successful_time: new Date('2024-03-01T12:00:00.000Z'), last_failed_time: new Date('2024-04-01T23:59:59.999Z')
                        }
                    )
                )) as any,
                delete: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmRepository>;

            const mockAlarmTriggerConnector: AlarmScheduler = jest.mocked<AlarmScheduler>({
                findByTime: jest.fn().mockReturnValue('alarm-trigger-0600') as any,
                create: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmScheduler>;

            await updateAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', new AlarmTime({hour: 6,minute:0}));

            expect(mockAlarmRepository.findByDeviceToken).toHaveBeenCalledWith('deviceToken');
            expect(mockAlarmTriggerConnector.findByTime).toHaveBeenCalledWith(new AlarmTime({hour: 6,minute:0}));
            expect(mockAlarmTriggerConnector.create).not.toHaveBeenCalled();
            expect(mockAlarmRepository.save).toHaveBeenCalledTimes(1);
            const save_argument = (mockAlarmRepository.save as jest.Mock).mock.calls[0][0] as Alarm;
            expect(save_argument.device).toEqual(new Device('deviceToken','ios'));
            expect(save_argument.alarmTime).toEqual(new AlarmTime({hour: 6,minute: 0}));
            expect(save_argument.user).toEqual(new User('aaaaaa'));
            expect(save_argument.alarmHistory.created_at.toISOString()).toEqual('2024-02-01T00:00:00.000Z');
            expect(save_argument.alarmHistory.last_successful_time?.toISOString()).toEqual('2024-03-01T12:00:00.000Z');
            expect(save_argument.alarmHistory.last_failed_time?.toISOString()).toEqual('2024-04-01T23:59:59.999Z');
        });
        test('アラームトリガーの作成に失敗した場合、UpdateErrorが発生すること', async () => {
            const mockAlarmRepository: AlarmRepository = jest.mocked<AlarmRepository>({
                save: jest.fn().mockReturnValue(true) as any,
                listByAlarmTime: jest.fn().mockReturnValue([]) as any,
                findByDeviceToken: jest.fn().mockReturnValue(new Alarm(new Device('deviceToken','ios'), new AlarmTime({hour: 6,minute:0}), new User('aaaaaa'))) as any,
                delete: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmRepository>;

            const mockAlarmTriggerConnector: AlarmScheduler = jest.mocked<AlarmScheduler>({
                findByTime: jest.fn().mockReturnValue(null) as any,
                create: jest.fn().mockReturnValue(false) as any
            }) as jest.Mocked<AlarmScheduler>;

            await expect(async () => {
                await updateAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', new AlarmTime({hour: 6,minute:0}));
            }).rejects.toThrow(UpdateError);
            expect(mockAlarmRepository.save).not.toHaveBeenCalled();
        });
        test('アラームの更新に失敗した場合、UpdateErrorが発生すること', async () => {
            const mockAlarmRepository: AlarmRepository = jest.mocked<AlarmRepository>({
                save: jest.fn().mockReturnValue(false) as any,
                listByAlarmTime: jest.fn().mockReturnValue([]) as any,
                findByDeviceToken: jest.fn().mockReturnValue(new Alarm(new Device('deviceToken','ios'), new AlarmTime({hour: 7,minute:0}), new User('aaaaaa'))) as any,
                delete: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmRepository>;

            const mockAlarmTriggerConnector: AlarmScheduler = jest.mocked<AlarmScheduler>({
                findByTime: jest.fn().mockReturnValue('alarm-trigger-0600') as any,
                create: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmScheduler>;

            await expect(async () => {
                await updateAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', new AlarmTime({hour: 6,minute:0}));
            }).rejects.toThrow(UpdateError);
            expect(mockAlarmTriggerConnector.create).not.toHaveBeenCalled();
        });
        test('登録済みのアラームが見つからない場合、UpdateErrorが発生すること', async () => {
            const mockAlarmRepository: AlarmRepository = jest.mocked<AlarmRepository>({
                save: jest.fn().mockReturnValue(true) as any,
                listByAlarmTime: jest.fn().mockReturnValue([]) as any,
                findByDeviceToken: jest.fn().mockReturnValue(null) as any,
                delete: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmRepository>;

            const mockAlarmTriggerConnector: AlarmScheduler = jest.mocked<AlarmScheduler>({
                findByTime: jest.fn().mockReturnValue('alarm-trigger-0600') as any,
                create: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmScheduler>;

            await expect(async () => {
                await updateAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', new AlarmTime({hour: 6,minute:0}));
            }).rejects.toThrow(UpdateError);
            expect(mockAlarmTriggerConnector.create).not.toHaveBeenCalled();
            expect(mockAlarmRepository.save).not.toHaveBeenCalled();
        });
    });
    describe('アラームの削除', () => {
        const date_constructor = Date;
        beforeEach(() => {
            global.Date = jest.fn(() => new date_constructor('2024-01-01T00:00:00.000Z')) as any;
        });
        afterEach(() => {
            global.Date = date_constructor;
            jest.clearAllMocks();
        });
        test('正常に削除できること', async () => {
            const mockAlarmRepository: AlarmRepository = jest.mocked<AlarmRepository>({
                save: jest.fn().mockReturnValue(true) as any,
                listByAlarmTime: jest.fn().mockReturnValue([]) as any,
                findByDeviceToken: jest.fn().mockReturnValue(new Alarm(new Device('deviceToken','ios'), new AlarmTime({hour: 7,minute:0}), new User('aaaaaa'))) as any,
                delete: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmRepository>;

            await deleteAlarm(mockAlarmRepository, 'deviceToken');

            expect(mockAlarmRepository.findByDeviceToken).toHaveBeenCalledWith('deviceToken');
            expect(mockAlarmRepository.delete).toHaveBeenCalledWith(new Alarm(new Device('deviceToken','ios'), new AlarmTime({hour: 7,minute:0}), new User('aaaaaa')));
        });
        test('登録済みのアラームが見つからない場合、DeleteErrorが発生すること', async () => {
            const mockAlarmRepository: AlarmRepository = jest.mocked<AlarmRepository>({
                save: jest.fn().mockReturnValue(true) as any,
                listByAlarmTime: jest.fn().mockReturnValue([]) as any,
                findByDeviceToken: jest.fn().mockReturnValue(null) as any,
                delete: jest.fn().mockReturnValue(true) as any
            }) as jest.Mocked<AlarmRepository>;

            await expect(async () => {
                await deleteAlarm(mockAlarmRepository, 'deviceToken');
            }).rejects.toThrow(DeleteError);
            expect(mockAlarmRepository.delete).not.toHaveBeenCalled();
        });
        test('アラームの削除に失敗した場合、DeleteErrorが発生すること', async () => {
            const mockAlarmRepository: AlarmRepository = jest.mocked<AlarmRepository>({
                save: jest.fn().mockReturnValue(true) as any,
                listByAlarmTime: jest.fn().mockReturnValue([]) as any,
                findByDeviceToken: jest.fn().mockReturnValue(new Alarm(new Device('deviceToken','ios'), new AlarmTime({hour: 7,minute:0}), new User('aaaaaa'))) as any,
                delete: jest.fn().mockReturnValue(false) as any
            }) as jest.Mocked<AlarmRepository>;

            expect(async () => {
                await deleteAlarm(mockAlarmRepository, 'deviceToken');
            }).rejects.toThrow(DeleteError);
        });
    });
});