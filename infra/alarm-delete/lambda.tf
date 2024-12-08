data "archive_file" "delete-function-zip" {
  type        = "zip"
  source_dir  = "${path.root}/../app/packages/delete/dist"
  output_path = "${path.module}/alarm-delete.zip"
}

resource "aws_lambda_function" "throwtrash-alarm-delete-lambda" {
  function_name = "throwtrash-alarm-delete"
  role          = aws_iam_role.throwtrash-alarm-delete-lambda-role.arn
  handler       = "index.handler"

  filename         = data.archive_file.delete-function-zip.output_path
  source_code_hash = data.archive_file.delete-function-zip.output_base64sha256

  runtime = "nodejs20.x"

  layers = [var.layer_arn]

  publish = var.environment == "prod"

  environment {
    variables = {
      ALARM_TABLE_NAME = var.alarm_table_name
    }
  }

  logging_config {
    log_format = "JSON"
    log_group  = aws_cloudwatch_log_group.throwtrash-alarm-delete-log-group.name
  }

  tags = local.tags
}

resource "aws_lambda_event_source_mapping" "sqs_event_source" {
  event_source_arn = aws_sqs_queue.alarm_delete_queue.arn
  function_name    = aws_lambda_function.throwtrash-alarm-delete-lambda.arn
  batch_size       = 10
  enabled          = true
}

resource "aws_sqs_queue" "alarm_delete_queue" {
  name = "throwtrash-alarm-delete-queue"
  tags = local.tags
}
