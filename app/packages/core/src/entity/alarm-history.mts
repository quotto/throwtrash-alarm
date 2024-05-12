import { ArgumentError } from "./argument-error.mjs";

export class AlarmHistory {
    private _created_at: Date;
    private _last_successful_time?: Date;
    private _last_failed_time?: Date;

    constructor(created_at: Date, history?: {last_successful_time?: Date, last_failed_time?: Date}) {
        if(history?.last_successful_time && history.last_successful_time < created_at) {
            throw new ArgumentError('成功日は作成日より後にできません');
        }
        if(history?.last_failed_time && history.last_failed_time < created_at) {
            throw new ArgumentError('失敗日は作成日より後にできません');
        }
        this._created_at = created_at;
        this._last_successful_time = history?.last_successful_time;
        this._last_failed_time = history?.last_failed_time;
    }

    updateLastSuccessfulTime(new_last_successful_time: Date): AlarmHistory {
        return new AlarmHistory(this._created_at, {last_successful_time: new_last_successful_time, last_failed_time: this._last_failed_time});
    }

    updateLastFailedTime(new_last_failed_time: Date): AlarmHistory {
        return new AlarmHistory(this._created_at, {last_successful_time: this._last_successful_time, last_failed_time: new_last_failed_time});
    }

    get created_at(): Date {
        return this._created_at;
    }
    get last_successful_time(): Date | undefined {
        return this._last_successful_time;
    }
    get last_failed_time(): Date | undefined {
        return this._last_failed_time;
    }
}