import { describe, test, expect } from '@jest/globals';
import { ArgumentError } from "../../src/entity/argument-error.mjs";
import { Device } from "../../src/entity/device.mjs";

describe('Device', () => {
    test('正常にDeviceインスタンスが生成される', () => {
        const device = new Device('deviceToken', 'ios');
        expect(device.getToken()).toEqual('deviceToken');
        expect(device.getPlatform()).toEqual('ios');
    });
    test('tokenが空の場合、エラーが発生する', () => {
        try {
            new Device('', 'ios');
        } catch (e: any) {
            expect(e).toBeInstanceOf(ArgumentError);
        }
    });
    test('platformが空の場合、エラーが発生する',()=> {
        try {
            new Device('deviceToken', '');
        } catch (e: any) {
            expect(e).toBeInstanceOf(ArgumentError);
        }
    })
    test('platformがios以外の場合、エラーが発生する', () => {
        try {
            new Device('deviceToken', 'android');
        } catch (e: any) {
            expect(e).toBeInstanceOf(ArgumentError);
        }
    });
});