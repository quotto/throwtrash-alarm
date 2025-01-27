import { SQSEvent, SQSHandler, Context, SQSBatchResponse, SQSBatchItemFailure, SQSRecord } from 'aws-lambda';
import 'source-map-support/register.js'
import { deleteAlarm } from '@shared/core/usecase/alarm-service.mjs';
import { DynamoDBAlarmRepository } from '@shared/core/infra/dynamodb-alarm-repository.mjs';
import { Alarm, AlarmTime } from '@shared/core/entity/alarm.mjs';
import { DeleteRequest } from '@shared/core/data/delete-request.mjs';
import { Device } from '@shared/core/entity/device.mjs';
import { User } from '@shared/core/entity/user.mjs';
import { AlarmHistory } from '@shared/core/entity/alarm-history.mjs';
import logger from '@shared/core/infra/logger.mjs';

const alarmRepository = new DynamoDBAlarmRepository({}, process.env.ALARM_TABLE_NAME!);

export const handler: SQSHandler = async (event: SQSEvent, _context: Context) => {
  const batchFailures: Array<SQSBatchItemFailure> = [];
  logger.debug('delete-failed-alarms', 'handler', 'SQSEventRecords', {data: event});
  for (const record of event.Records) {
    logger.debug('delete-failed-alarms', 'handler', 'SQSEventRecord', {data: record.body});
    try {
      await processRecord(record);
    } catch (error: any) {
      logger.error('delete-failed-alarms', 'handler', error.message || '不明なエラーが発生しました', {error: error, data: record.body});
      batchFailures.push({
        itemIdentifier: record.messageId
      });
    }
  }
  const result: SQSBatchResponse = {
    batchItemFailures: batchFailures
  }
  logger.info('delete-failed-alarms', 'handler', '処理が完了しました。', {data: result});
  return result;
};

const processRecord = async (record: SQSRecord) => {
  const requestData: DeleteRequest = JSON.parse(record.body);
  const alarm = new Alarm(
    new Device(requestData.alarm.device_token, requestData.alarm.platform),
    new AlarmTime(requestData.alarm.alarm_time),
    new User(requestData.alarm.user_id),
    new AlarmHistory(
      new Date(requestData.alarm.created_at),
      {
        last_successful_time: requestData.alarm.last_successful_time ? new Date(requestData.alarm.last_successful_time) : undefined,
        last_failed_time: requestData.alarm.last_failed_time ? new Date(requestData.alarm.last_failed_time) : undefined
      }
    )
  );
  const newestFailedTime = new Date(requestData.newest_failed_time);

  // アラームの最終成功日時から現在の失敗日時まで30日以上経過している
  // または アラームの作成日から現在の失敗日時まで30日以上経過しているアラームを削除する
  const startTime = alarm.alarmHistory.last_successful_time ? new Date(alarm.alarmHistory.last_successful_time) : new Date(alarm.alarmHistory.created_at);
  console.info(`startTime: ${startTime.getTime()}, newestFailedTime: ${newestFailedTime.getTime()-30*24*60*60*1000}`);
  if (startTime.getTime() < newestFailedTime.getTime() - 30 * 24 * 60 * 60 * 1000) {
    try {
      await deleteAlarm(alarmRepository, alarm.device.getToken());
      logger.info('delete-failed-alarms', 'processRecord', 'アラームを削除しました', {data: {alarm, newest_failed_time: newestFailedTime}});
    } catch (error: any) {
      logger.error('delete-failed-alarms', 'processRecord', error.message || '不明なエラーが発生しました', {error: error, data: {alarm, newest_failed_time: newestFailedTime}});
      throw error;
    }
  } else {
    logger.info('delete-failed-alarms', 'processRecord', '削除対象外のためスキップします', {data: {alarm, newest_failed_time: newestFailedTime}});
  }
}
