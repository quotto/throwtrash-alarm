describe('Alarm', () => {
    it('正常にAlarmインスタンスが生成される', () => {
        const device = new Device('deviceToken', 'ios');
        const user = new User('userId');
        const alarm = new Alarm(device, '1200', user);
        expect(alarm.getDevice()).toEqual(device);
        expect(alarm.getTime()).toEqual('1200');
        expect(alarm.getUser()).toEqual(user);
    });
    it('正常にAlarmインスタンスが生成される(午前境界値))', () => {
        const device = new Device('deviceToken', 'ios');
        const user = new User('userId');
        let alarm = new Alarm(device, '0000', user);
        expect(alarm.getTime()).toEqual('0000');

        alarm = new Alarm(device, '0059', user);
        expect(alarm.getTime()).toEqual('0059');

        alarm = new Alarm(device, '1159', user);
        expect(alarm.getTime()).toEqual('1159');
    });
    it('正常にAlarmインスタンスが生成される(午後境界値))', () => {
        const device = new Device('deviceToken', 'ios');
        const user = new User('userId');
        let alarm = new Alarm(device, '1200', user);
        expect(alarm.getTime()).toEqual('1200');

        alarm = new Alarm(device, '1259', user);
        expect(alarm.getTime()).toEqual('1259');

        alarm = new Alarm(device, '2359', user);
        expect(alarm.getTime()).toEqual('2359');
    });

    it('timeが3桁の場合、エラーが発生する', () => {
        const device = new Device('deviceToken', 'ios');
        const user = new User('userId');
        try {
            new Alarm(device, '100', user);
        } catch (e: any) {
            expect(e).toBeInstanceOf(ArgumentError);
        }
    })
    it('timeが5桁の場合、エラーが発生する', () => {
        const device = new Device('deviceToken', 'ios');
        const user = new User('userId');
        try {
            new Alarm(device, '10000', user);
        } catch (e: any) {
            expect(e).toBeInstanceOf(ArgumentError);
        }
    });
    it('timeが数字以外の場合、エラーが発生する', () => {
        const device = new Device('deviceToken', 'ios');
        const user = new User('userId');
        try {
            new Alarm(device, 'abcd', user);
        } catch (e: any) {
            expect(e).toBeInstanceOf(ArgumentError);
        }
    });
    it('timeが24時以降の場合、エラーが発生する', () => {
        const device = new Device('deviceToken', 'ios');
        const user = new User('userId');
        try {
            new Alarm(device, '2400', user);
        } catch (e: any) {
            expect(e).toBeInstanceOf(ArgumentError);
        }
    });
    it('timeが60分以降の場合、エラーが発生する', () => {
        const device = new Device('deviceToken', 'ios');
        const user = new User('userId');
        try {
            new Alarm(device, '1260', user);
        } catch (e: any) {
            expect(e).toBeInstanceOf(ArgumentError);
        }
    });
});