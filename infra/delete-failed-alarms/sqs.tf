resource "aws_sqs_queue" "alarm_delete_queue" {
  name = "throwtrash-alarm-delete-failed-alarms-queue"
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.alarm_delete_queue_deadletter.arn
    // 2回メッセージの処理に失敗したらデッドレターキューに送る
    maxReceiveCount = 2
  })
  visibility_timeout_seconds = 60
  tags = var.tags
}

resource "aws_sqs_queue" "alarm_delete_queue_deadletter" {
  name = "throwtrash-alarm-delete-failed-alarms-queue-deadletter"
}
