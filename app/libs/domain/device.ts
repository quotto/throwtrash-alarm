class Device {
    private token: string;
    private platform: string;
    constructor(token: string, platform: string) {
        if (!token) {
            throw new ArgumentError('パラメータtokenが不正です');
        }
        if (!platform || platform !== 'ios') {
            throw new ArgumentError('パラメータplatformが不正です');
        }
        this.token = token;
        this.platform = platform;
    }
    getToken(): string {
        return this.token;
    }
    getPlatform(): string {
        return this.platform;
    }
}