import { jest } from '@jest/globals';

// ESMで書かれたコードのモジュールをモックするにはawait import前にjest.unstable_mockModuleeが必要になるため、モック関数の中でテストに必要なレスポンスの切り替えを行う。
jest.unstable_mockModule("@shared/core/usecase/alarm-service.mjs",() => {
    return {
        deleteAlarm: jest.fn(() => {})
        };
    }
);

import { Context, SQSEvent } from 'aws-lambda';
const { handler } = await import('../src/index.mjs');
const { deleteAlarm } = await import('@shared/core/usecase/alarm-service.mjs');

describe("handler", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    const context: Context = {
        awsRequestId: "awsRequestId",
        callbackWaitsForEmptyEventLoop: true,
        functionName: "functionName",
        functionVersion: "functionVersion",
        invokedFunctionArn: "invokedFunctionArn",
        logGroupName: "logGroupName",
        logStreamName: "logStreamName",
        memoryLimitInMB: "memoryLimitInMB",
        getRemainingTimeInMillis: () => 1000,
        done: () => { },
        fail: () => { },
        succeed: () => { }
    };
    test("if_newest_failed_time_past_over_30_days_from_last_successful_time_then_delete_alarm", async () => {
        // Arrange
        const sqsRecords: SQSEvent = {
            Records: [
                {
                    messageId: "1",
                    attributes: {
                        ApproximateReceiveCount: "1",
                        SentTimestamp: "1",
                        SenderId: "1",
                        ApproximateFirstReceiveTimestamp: "1"
                    },
                    messageAttributes: {},
                    md5OfBody: "1",
                    eventSource: "eventSource",
                    eventSourceARN: "eventSourceARN",
                    awsRegion: "awsRegion",
                    receiptHandle: "receiptHandle",
                    body: JSON.stringify({
                        alarm: {
                            device_token: "d-1",
                            platform: "ios",
                            alarm_time: "0100",
                            user_id: "u-1",
                            created_at: "2022-01-01T00:00:00Z",
                            last_successful_time: "2022-01-01T01:00:00Z",
                            last_failed_time: "2022-01-29T01:00:00Z"
                        },
                        newest_failed_time: "2022-01-31T01:00:01Z"
                    })
                }
            ]
        }
        // Act
        const result = await handler(sqsRecords, context , {} as any);

        // Assert
        expect(result).toEqual({
            batchItemFailures: []
        });
        expect(deleteAlarm).toHaveBeenCalledTimes(1);
        expect(deleteAlarm).toHaveBeenCalledWith(expect.anything(), "d-1");
    });
    test("if_newest_failed_time_past_over_30_days_from_created_at_then_delete_alarm", async () => {
        // Arrange
        const sqsRecords: SQSEvent = {
            Records: [
                {
                    messageId: "1",
                    attributes: {
                        ApproximateReceiveCount: "1",
                        SentTimestamp: "1",
                        SenderId: "1",
                        ApproximateFirstReceiveTimestamp: "1"
                    },
                    messageAttributes: {},
                    md5OfBody: "1",
                    eventSource: "eventSource",
                    eventSourceARN: "eventSourceARN",
                    awsRegion: "awsRegion",
                    receiptHandle: "receiptHandle",
                    body: JSON.stringify({
                        alarm: {
                            device_token: "d-1",
                            platform: "ios",
                            alarm_time: "0100",
                            user_id: "u-1",
                            created_at: "2022-01-01T00:00:00Z",
                            last_failed_time: "2022-01-01T01:00:00Z"
                        },
                        newest_failed_time: "2022-01-31T00:00:01Z"
                    })
                }
            ]
        }
        // Act
        const result = await handler(sqsRecords, context , {} as any);

        // Assert
        expect(result).toEqual({
            batchItemFailures: []
        });
        expect(deleteAlarm).toHaveBeenCalledWith(expect.anything(), "d-1");
    });
    test("if_newest_failed_time_not_past_over_30_days_from_last_successful_time", async () => {
        // Arrange
        const sqsRecords: SQSEvent = {
            Records: [
                {
                    messageId: "1",
                    attributes: {
                        ApproximateReceiveCount: "1",
                        SentTimestamp: "1",
                        SenderId: "1",
                        ApproximateFirstReceiveTimestamp: "1"
                    },
                    messageAttributes: {},
                    md5OfBody: "1",
                    eventSource: "eventSource",
                    eventSourceARN: "eventSourceARN",
                    awsRegion: "awsRegion",
                    receiptHandle: "receiptHandle",
                    body: JSON.stringify({
                        alarm: {
                            device_token: "d-1",
                            platform: "ios",
                            alarm_time: "0100",
                            user_id: "u-1",
                            created_at: "2022-01-01T00:00:00Z",
                            last_successful_time: "2022-01-01T01:00:00Z",
                            last_failed_time: "2022-01-29T01:00:00Z"
                        },
                        newest_failed_time: "2022-01-31T01:00:00Z"
                    })
                }
            ]
        }
        // Act
        const result = await handler(sqsRecords, context , {} as any);

        // Assert
        expect(result).toEqual({
            batchItemFailures: []
        });
        expect(deleteAlarm).not.toHaveBeenCalled();
    });
    test("if_newest_failed_time_not_past_over_30_days_from_created_at_then_not_delete_alarm", async () => {
        // Arrange
        const sqsRecords: SQSEvent = {
            Records: [
                {
                    messageId: "1",
                    attributes: {
                        ApproximateReceiveCount: "1",
                        SentTimestamp: "1",
                        SenderId: "1",
                        ApproximateFirstReceiveTimestamp: "1"
                    },
                    messageAttributes: {},
                    md5OfBody: "1",
                    eventSource: "eventSource",
                    eventSourceARN: "eventSourceARN",
                    awsRegion: "awsRegion",
                    receiptHandle: "receiptHandle",
                    body: JSON.stringify({
                        alarm: {
                            device_token: "d-1",
                            platform: "ios",
                            alarm_time: "0100",
                            user_id: "u-1",
                            created_at: "2022-01-01T10:00:00Z",
                            last_failed_time: "2022-01-29T01:00:00Z"
                        },
                        newest_failed_time: "2022-01-31T10:00:00Z"
                    })
                }
            ]
        }
        // Act
        const result = await handler(sqsRecords, context , {} as any);

        // Assert
        expect(result).toEqual({
            batchItemFailures: []
        });
        expect(deleteAlarm).not.toHaveBeenCalled();
    });
    test("if_delete_alarm_failed_then_return_batchItemFailures", async () => {
        // Arrange
        jest.mocked(deleteAlarm).mockRejectedValueOnce(new Error("error-message"));
        const sqsRecords: SQSEvent = {
            Records: [
                {
                    messageId: "1",
                    attributes: {
                        ApproximateReceiveCount: "1",
                        SentTimestamp: "1",
                        SenderId: "1",
                        ApproximateFirstReceiveTimestamp: "1"
                    },
                    messageAttributes: {},
                    md5OfBody: "1",
                    eventSource: "eventSource",
                    eventSourceARN: "eventSourceARN",
                    awsRegion: "awsRegion",
                    receiptHandle: "receiptHandle",
                    body: JSON.stringify({
                        alarm: {
                            device_token: "d-1",
                            platform: "ios",
                            alarm_time: "0100",
                            user_id: "u-1",
                            created_at: "2022-01-01T00:00:00Z",
                            last_successful_time: "2022-01-01T01:00:00Z",
                            last_failed_time: "2022-01-30T01:00:00Z"
                        },
                        newest_failed_time: "2022-01-31T01:00:01Z"
                    })
                }
            ]
        }
        // Act
        const result = await handler(sqsRecords, context , {} as any);

        // Assert
        expect(result).toEqual({
            batchItemFailures: [
                {
                    itemIdentifier: "1"
                }
            ]
        });
    });
    test("if_sqs_events_empty_then_return_empty_batchItemFailures", async () => {
        // Arrange
        const sqsRecords: SQSEvent = {
            Records: []
        }
        // Act
        const result = await handler(sqsRecords, context , {} as any);

        // Assert
        expect(result).toEqual({
            batchItemFailures: []
        });
        expect(deleteAlarm).not.toHaveBeenCalled();
    });
    test("if_sqs_events_multiple_then_delete_match_alarm", async () => {
        // Arrange
        const sqsRecords: SQSEvent = {
            Records: [
                {
                    messageId: "1",
                    attributes: {
                        ApproximateReceiveCount: "1",
                        SentTimestamp: "1",
                        SenderId: "1",
                        ApproximateFirstReceiveTimestamp: "1"
                    },
                    messageAttributes: {},
                    md5OfBody: "1",
                    eventSource: "eventSource",
                    eventSourceARN: "eventSourceARN",
                    awsRegion: "awsRegion",
                    receiptHandle: "receiptHandle",
                    body: JSON.stringify({
                        alarm: {
                            device_token: "d-1",
                            platform: "ios",
                            alarm_time: "0100",
                            user_id: "u-1",
                            created_at: "2022-01-01T00:00:00Z",
                            last_successful_time: "2022-01-01T01:00:00Z",
                            last_failed_time: "2022-01-30T01:00:00Z"
                        },
                        newest_failed_time: "2022-01-31T10:00:01Z"
                    })
                },
                {
                    messageId: "2",
                    attributes: {
                        ApproximateReceiveCount: "1",
                        SentTimestamp: "1",
                        SenderId: "1",
                        ApproximateFirstReceiveTimestamp: "1"
                    },
                    messageAttributes: {},
                    md5OfBody: "1",
                    eventSource: "eventSource",
                    eventSourceARN: "eventSourceARN",
                    awsRegion: "awsRegion",
                    receiptHandle: "receiptHandle",
                    body: JSON.stringify({
                        alarm: {
                            device_token: "d-2",
                            platform: "ios",
                            alarm_time: "0100",
                            user_id: "u-1",
                            created_at: "2022-01-01T00:00:00Z",
                            last_successful_time: "2024-02-01T01:00:00Z",
                            last_failed_time: "2024-02-28T01:00:00Z"
                        },
                        newest_failed_time: "2024-03-03T01:00:00Z"
                    })
                }
            ]
        }
        // Act
        const result = await handler(sqsRecords, context , {} as any);

        // Assert
        expect(result).toEqual({
            batchItemFailures: []
        });
        expect(deleteAlarm).toHaveBeenCalledTimes(2);
    });
    test("if_sqs_events_multiple_and_occur_erros_at_part_of_data_then_return_batchItemFailures_with_error_messages", async () => {
        // Arrange
        jest.mocked(deleteAlarm).mockImplementation(async (dbrepository,deviceToken) => {
            if(deviceToken === "d-1" || deviceToken === "d-2") throw new Error("error-message");
        });
        const sqsRecords: SQSEvent = {
            Records: [
                {
                    messageId: "1",
                    attributes: {
                        ApproximateReceiveCount: "1",
                        SentTimestamp: "1",
                        SenderId: "1",
                        ApproximateFirstReceiveTimestamp: "1"
                    },
                    messageAttributes: {},
                    md5OfBody: "1",
                    eventSource: "eventSource",
                    eventSourceARN: "eventSourceARN",
                    awsRegion: "awsRegion",
                    receiptHandle: "receiptHandle",
                    body: JSON.stringify({
                        alarm: {
                            device_token: "d-1",
                            platform: "ios",
                            alarm_time: "0100",
                            user_id: "u-1",
                            created_at: "2022-01-01T00:00:00Z",
                            last_successful_time: "2022-01-01T01:00:00Z",
                            last_failed_time: "2022-01-30T01:00:00Z"
                        },
                        newest_failed_time: "2022-01-31T01:00:01Z"
                    })
                },
                {
                    messageId: "2",
                    attributes: {
                        ApproximateReceiveCount: "1",
                        SentTimestamp: "1",
                        SenderId: "1",
                        ApproximateFirstReceiveTimestamp: "1"
                    },
                    messageAttributes: {},
                    md5OfBody: "1",
                    eventSource: "eventSource",
                    eventSourceARN: "eventSourceARN",
                    awsRegion: "awsRegion",
                    receiptHandle: "receiptHandle",
                    body: JSON.stringify({
                        alarm: {
                            device_token: "d-2",
                            platform: "ios",
                            alarm_time: "0100",
                            user_id: "u-1",
                            created_at: "2022-01-01T00:00:00Z",
                            last_successful_time: "2024-02-01T01:00:00Z",
                            last_failed_time: "2024-02-28T01:00:00Z"
                        },
                        newest_failed_time: "2024-03-03T01:00:00Z"
                    })
                },
                {
                    messageId: "3",
                    attributes: {
                        ApproximateReceiveCount: "1",
                        SentTimestamp: "1",
                        SenderId: "1",
                        ApproximateFirstReceiveTimestamp: "1"
                    },
                    messageAttributes: {},
                    md5OfBody: "1",
                    eventSource: "eventSource",
                    eventSourceARN: "eventSourceARN",
                    awsRegion: "awsRegion",
                    receiptHandle: "receiptHandle",
                    body: JSON.stringify({
                        alarm: {
                            device_token: "d-3",
                            platform: "ios",
                            alarm_time: "0100",
                            user_id: "u-1",
                            created_at: "2022-01-01T00:00:00Z",
                            last_successful_time: "2024-02-01T01:00:00Z",
                            last_failed_time: "2024-02-28T01:00:00Z"
                        },
                        newest_failed_time: "2024-03-03T01:00:00Z"
                    })
                }
            ]
        }
        // Act
        const result = await handler(sqsRecords, context , {} as any);

        // Assert
        expect(result).toEqual({
            batchItemFailures: [
                {
                    itemIdentifier: "1"
                },
                {
                    itemIdentifier: "2"
                }
            ]
        });
    });
});
