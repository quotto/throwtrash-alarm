import { ArgumentError } from "../../../libs/domain/argument-error.mjs";
import { Device } from "../../../libs/domain/device.mjs";

describe('Device', () => {
    it('正常にDeviceインスタンスが生成される', () => {
        const device = new Device('deviceToken', 'ios');
        expect(device.getToken()).toEqual('deviceToken');
        expect(device.getPlatform()).toEqual('ios');
    });
    it('tokenが空の場合、エラーが発生する', () => {
        try {
            new Device('', 'ios');
        } catch (e: any) {
            expect(e).toBeInstanceOf(ArgumentError);
        }
    });
    it('platformが空の場合、エラーが発生する',()=> {
        try {
            new Device('deviceToken', '');
        } catch (e: any) {
            expect(e).toBeInstanceOf(ArgumentError);
        }
    })
    it('platformがios以外の場合、エラーが発生する', () => {
        try {
            new Device('deviceToken', 'android');
        } catch (e: any) {
            expect(e).toBeInstanceOf(ArgumentError);
        }
    });
});