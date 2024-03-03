interface DbInterface {
    registerAlarmTable: (deviceToken: string, time: string, userId: string, platform: string) => Promise<boolean>;
    updateAlarmTable: (deviceToken: string, time: string) => Promise<boolean>;
    deleteAlarmTable: (deviceToken: string) => Promise<boolean>;
}