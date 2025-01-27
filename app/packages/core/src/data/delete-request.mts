export type DeleteRequest = {
    alarm: {
      device_token: string;
      alarm_time: string;
      user_id: string;
      platform: string;
      created_at: string;
      last_successful_time: string | undefined;
      last_failed_time: string | undefined;
    };
    newest_failed_time: string;
}