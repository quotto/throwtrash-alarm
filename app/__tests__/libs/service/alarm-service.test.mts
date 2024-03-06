import { Alarm } from "../../../libs/domain/alarm.mjs";
import { Device } from "../../../libs/domain/device.mjs";
import { User } from "../../../libs/domain/user.mjs";
import { AlarmRepository } from "../../../libs/repository/alarm-repository.mjs";
import { AlarmRepositoryInterface } from "../../../libs/service/alarm-repository-interface.mjs";
import { DeleteError, RegisterError, UpdateError, deleteAlarm, registerAlarm, updateAlarm } from "../../../libs/service/alarm-service.mjs";
import { AlarmTriggerConnectorInterface } from "../../../libs/service/alarm-trigger-connector-interface.mjs";

describe('AlarmService', () => {
    describe('アラームの登録', () => {
        it('正常に登録できること-アラームトリガーが存在しない場合は新規に作成する', async () => {
            const mockAlarmRepository: AlarmRepositoryInterface = jest.mocked<AlarmRepositoryInterface>({
                create: jest.fn().mockReturnValue(true),
                findByDeviceToken: jest.fn().mockReturnValue(null),
                update: jest.fn().mockReturnValue(true),
                delete: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmRepositoryInterface>;

            const mockAlarmTriggerConnector: AlarmTriggerConnectorInterface = jest.mocked<AlarmTriggerConnectorInterface>({
                findByTime: jest.fn().mockReturnValue(null),
                create: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmTriggerConnectorInterface>;

            await registerAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', '0700', 'aaaaaa', 'ios');

            expect(mockAlarmTriggerConnector.findByTime).toHaveBeenCalledWith('0700');
            expect(mockAlarmTriggerConnector.create).toHaveBeenCalledWith("0700")
            expect(mockAlarmRepository.create).toHaveBeenCalledWith(new Alarm(new Device('deviceToken','ios'), '0700', new User('aaaaaa')));
        });
        it('正常に登録できること-アラームトリガーが存在する場合は新規に作成しない', async () => {
            const mockAlarmRepository: AlarmRepositoryInterface = jest.mocked<AlarmRepositoryInterface>({
                create: jest.fn().mockReturnValue(true),
                findByDeviceToken: jest.fn().mockReturnValue(null),
                update: jest.fn().mockReturnValue(true),
                delete: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmRepositoryInterface>;

            const mockAlarmTriggerConnector: AlarmTriggerConnectorInterface = jest.mocked<AlarmTriggerConnectorInterface>({
                findByTime: jest.fn().mockReturnValue('alarm-trigger-0700'),
                create: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmTriggerConnectorInterface>;

            await registerAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', '0700', 'aaaaaa', 'ios');

            expect(mockAlarmTriggerConnector.create).not.toHaveBeenCalled();
            expect(mockAlarmRepository.create).toHaveBeenCalledWith(new Alarm(new Device('deviceToken','ios'), '0700', new User('aaaaaa')));
        });
        it('アラームトリガーの作成に失敗した場合、RegisterErrorが発生すること', async () => {
            const mockAlarmRepository: AlarmRepositoryInterface = jest.mocked<AlarmRepositoryInterface>({
                create: jest.fn().mockReturnValue(true),
                findByDeviceToken: jest.fn().mockReturnValue(null),
                update: jest.fn().mockReturnValue(true),
                delete: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmRepositoryInterface>;

            const mockAlarmTriggerConnector: AlarmTriggerConnectorInterface = jest.mocked<AlarmTriggerConnectorInterface>({
                findByTime: jest.fn().mockReturnValue(null),
                create: jest.fn().mockReturnValue(false)
            }) as jest.Mocked<AlarmTriggerConnectorInterface>;

            await expect(async () => {
                await registerAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', '0700', 'aaaaaa', 'ios');
            }).rejects.toThrow(RegisterError);
            expect(mockAlarmRepository.create).not.toHaveBeenCalled();
        });
        it('アラームの登録に失敗した場合、RegisterErrorが発生すること', async () => {
            const mockAlarmRepository: AlarmRepositoryInterface = jest.mocked<AlarmRepositoryInterface>({
                create: jest.fn().mockReturnValue(false),
                findByDeviceToken: jest.fn().mockReturnValue(null),
                update: jest.fn().mockReturnValue(true),
                delete: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmRepositoryInterface>;

            const mockAlarmTriggerConnector: AlarmTriggerConnectorInterface = jest.mocked<AlarmTriggerConnectorInterface>({
                findByTime: jest.fn().mockReturnValue(null),
                create: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmTriggerConnectorInterface>;

            await expect(async () => {
                await registerAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', '0700', 'aaaaaa', 'ios');
            }).rejects.toThrow(RegisterError);
            expect(mockAlarmTriggerConnector.create).toHaveBeenCalledWith('0700');
        });
    });
    describe('アラームの更新', () => {
        it('正常に更新できること-アラームトリガーが存在しない場合は新規に作成する', async () => {
            const mockAlarmRepository: AlarmRepositoryInterface = jest.mocked<AlarmRepositoryInterface>({
                create: jest.fn().mockReturnValue(true),
                findByDeviceToken: jest.fn().mockReturnValue(new Alarm(new Device('deviceToken','ios'), '0700', new User('aaaaaa'))),
                update: jest.fn().mockReturnValue(true),
                delete: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmRepositoryInterface>;

            const mockAlarmTriggerConnector: AlarmTriggerConnectorInterface = jest.mocked<AlarmTriggerConnectorInterface>({
                findByTime: jest.fn().mockReturnValue(null),
                create: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmTriggerConnectorInterface>;

            await updateAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', '0600');

            expect(mockAlarmTriggerConnector.create).toHaveBeenCalledWith("0600")
            expect(mockAlarmRepository.update).toHaveBeenCalledWith(new Alarm(new Device('deviceToken','ios'), '0600', new User('aaaaaa')));
        });
        it("正常に更新できること-アラームトリガーが存在する場合は新規に作成しない", async () => {
            const mockAlarmRepository: AlarmRepositoryInterface = jest.mocked<AlarmRepositoryInterface>({
                create: jest.fn().mockReturnValue(true),
                findByDeviceToken: jest.fn().mockReturnValue(new Alarm(new Device('deviceToken','ios'), '0700', new User('aaaaaa'))),
                update: jest.fn().mockReturnValue(true),
                delete: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmRepositoryInterface>;

            const mockAlarmTriggerConnector: AlarmTriggerConnectorInterface = jest.mocked<AlarmTriggerConnectorInterface>({
                findByTime: jest.fn().mockReturnValue('alarm-trigger-0600'),
                create: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmTriggerConnectorInterface>;

            await updateAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', '0600');

            expect(mockAlarmRepository.findByDeviceToken).toHaveBeenCalledWith('deviceToken');
            expect(mockAlarmTriggerConnector.findByTime).toHaveBeenCalledWith('0600');
            expect(mockAlarmTriggerConnector.create).not.toHaveBeenCalled();
            expect(mockAlarmRepository.update).toHaveBeenCalledWith(new Alarm(new Device('deviceToken','ios'), '0600', new User('aaaaaa')));
        });
        it('アラームトリガーの作成に失敗した場合、UpdateErrorが発生すること', async () => {
            const mockAlarmRepository: AlarmRepositoryInterface = jest.mocked<AlarmRepositoryInterface>({
                create: jest.fn().mockReturnValue(true),
                findByDeviceToken: jest.fn().mockReturnValue(new Alarm(new Device('deviceToken','ios'), '0700', new User('aaaaaa'))),
                update: jest.fn().mockReturnValue(true),
                delete: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmRepositoryInterface>;

            const mockAlarmTriggerConnector: AlarmTriggerConnectorInterface = jest.mocked<AlarmTriggerConnectorInterface>({
                findByTime: jest.fn().mockReturnValue(null),
                create: jest.fn().mockReturnValue(false)
            }) as jest.Mocked<AlarmTriggerConnectorInterface>;

            await expect(async () => {
                await updateAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', '0600');
            }).rejects.toThrow(UpdateError);
            expect(mockAlarmRepository.update).not.toHaveBeenCalled();
        });
        it('アラームの更新に失敗した場合、UpdateErrorが発生すること', async () => {
            const mockAlarmRepository: AlarmRepositoryInterface = jest.mocked<AlarmRepositoryInterface>({
                create: jest.fn().mockReturnValue(true),
                findByDeviceToken: jest.fn().mockReturnValue(new Alarm(new Device('deviceToken','ios'), '0700', new User('aaaaaa'))),
                update: jest.fn().mockReturnValue(false),
                delete: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmRepositoryInterface>;

            const mockAlarmTriggerConnector: AlarmTriggerConnectorInterface = jest.mocked<AlarmTriggerConnectorInterface>({
                findByTime: jest.fn().mockReturnValue('alarm-trigger-0600'),
                create: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmTriggerConnectorInterface>;

            await expect(async () => {
                await updateAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', '0600');
            }).rejects.toThrow(UpdateError);
            expect(mockAlarmTriggerConnector.create).not.toHaveBeenCalled();
        });
        it('登録済みのアラームが見つからない場合、UpdateErrorが発生すること', async () => {
            const mockAlarmRepository: AlarmRepositoryInterface = jest.mocked<AlarmRepositoryInterface>({
                create: jest.fn().mockReturnValue(true),
                findByDeviceToken: jest.fn().mockReturnValue(null),
                update: jest.fn().mockReturnValue(true),
                delete: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmRepositoryInterface>;

            const mockAlarmTriggerConnector: AlarmTriggerConnectorInterface = jest.mocked<AlarmTriggerConnectorInterface>({
                findByTime: jest.fn().mockReturnValue('alarm-trigger-0600'),
                create: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmTriggerConnectorInterface>;

            await expect(async () => {
                await updateAlarm(mockAlarmRepository, mockAlarmTriggerConnector, 'deviceToken', '0600');
            }).rejects.toThrow(UpdateError);
            expect(mockAlarmTriggerConnector.create).not.toHaveBeenCalled();
            expect(mockAlarmRepository.update).not.toHaveBeenCalled();
        });
     });
     describe('アラームの削除', () => {
        it('正常に削除できること', async () => {
            const mockAlarmRepository: AlarmRepositoryInterface = jest.mocked<AlarmRepositoryInterface>({
                create: jest.fn().mockReturnValue(true),
                findByDeviceToken: jest.fn().mockReturnValue(new Alarm(new Device('deviceToken','ios'), '0700', new User('aaaaaa'))),
                update: jest.fn().mockReturnValue(true),
                delete: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmRepositoryInterface>;

            await deleteAlarm(mockAlarmRepository, 'deviceToken');

            expect(mockAlarmRepository.findByDeviceToken).toHaveBeenCalledWith('deviceToken');
            expect(mockAlarmRepository.delete).toHaveBeenCalledWith(new Alarm(new Device('deviceToken','ios'), '0700', new User('aaaaaa')));
        });
        it('登録済みのアラームが見つからない場合、DeleteErrorが発生すること', async () => {
            const mockAlarmRepository: AlarmRepositoryInterface = jest.mocked<AlarmRepositoryInterface>({
                create: jest.fn().mockReturnValue(true),
                findByDeviceToken: jest.fn().mockReturnValue(null),
                update: jest.fn().mockReturnValue(true),
                delete: jest.fn().mockReturnValue(true)
            }) as jest.Mocked<AlarmRepositoryInterface>;

            await expect(async () => {
                await deleteAlarm(mockAlarmRepository, 'deviceToken');
            }).rejects.toThrow(DeleteError);
            expect(mockAlarmRepository.delete).not.toHaveBeenCalled();
        });
        it('アラームの削除に失敗した場合、DeleteErrorが発生すること', async () => {
            const mockAlarmRepository: AlarmRepositoryInterface = jest.mocked<AlarmRepositoryInterface>({
                create: jest.fn().mockReturnValue(true),
                findByDeviceToken: jest.fn().mockReturnValue(new Alarm(new Device('deviceToken','ios'), '0700', new User('aaaaaa'))),
                update: jest.fn().mockReturnValue(true),
                delete: jest.fn().mockReturnValue(false)
            }) as jest.Mocked<AlarmRepositoryInterface>;

            expect(async () => {
                await deleteAlarm(mockAlarmRepository, 'deviceToken');
            }).rejects.toThrow(DeleteError);
        });
    });
});