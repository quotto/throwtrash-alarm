export interface AlarmTriggerConnectorInterface {
    create(time: string): Promise<boolean>;
    findByTime(time: string): Promise<string | null>;
}