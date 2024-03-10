import { describe, test, expect } from '@jest/globals';
import { ArgumentError } from "../../../libs/domain/argument-error.mjs";
import { User } from "../../../libs/domain/user.mjs";

describe('User', () => {
    test('正常にUserインスタンスが生成される', () => {
        const user = new User('userId');
        expect(user.getId()).toEqual('userId');
    });
    test('idが空の場合、エラーが発生する', () => {
        try {
            new User('');
        } catch (e: any) {
            expect(e).toBeInstanceOf(ArgumentError);
        }
    });
 })