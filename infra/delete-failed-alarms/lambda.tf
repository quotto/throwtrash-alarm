locals {
  function_name = "throwtrash-alarm-delete-failed-alarms"
}
data "archive_file" "delete-function-zip" {
  type        = "zip"
  source_dir  = "${path.root}/../app/packages/maintain/delete-failed-alarms/dist"
  output_path = "${path.module}/delete-failed-alarms.zip"
}

resource "aws_lambda_function" "throwtrash-alarm-delete-lambda" {
  function_name = local.function_name
  role          = aws_iam_role.throwtrash-alarm-delete-lambda-role.arn
  handler       = "index.handler"

  filename         = data.archive_file.delete-function-zip.output_path
  source_code_hash = data.archive_file.delete-function-zip.output_base64sha256

  runtime = "nodejs20.x"

  layers = [var.layer_arn]

  publish = var.environment == "prod"

  timeout = 30

  environment {
    variables = {
      ALARM_TABLE_NAME = var.alarm_table_name
    }
  }

  logging_config {
    log_format = "JSON"
    log_group  = aws_cloudwatch_log_group.throwtrash-alarm-delete-log-group.name
    application_log_level = var.environment == "prod" ? "INFO" : "DEBUG"
  }

  tags = var.tags
}

resource "aws_lambda_event_source_mapping" "sqs_event_source" {
  event_source_arn = aws_sqs_queue.alarm_delete_queue.arn
  function_name    = aws_lambda_function.throwtrash-alarm-delete-lambda.arn
  batch_size       = 10
  // 5秒以上待ってもbatch_sizeに満たない場合は処理を開始する
  maximum_batching_window_in_seconds = 5
  function_response_types = [ "ReportBatchItemFailures" ]
  enabled          = true
  tags = var.tags
}