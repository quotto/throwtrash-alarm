data "archive_file" "trigger-function-zip" {
    type        = "zip"
    source_dir  = "${path.root}/../app/packages/trigger/dist"
    output_path = "${path.module}/alarm-trigger.zip"
}
resource "aws_lambda_function" "throwtrash-alarm-trigger-lambda" {
    function_name = "throwtrash-alarm-trigger"
    role          = aws_iam_role.throwtrash-alarm-trigger-lambda-role.arn
    handler       = "index.handler"

    filename      = data.archive_file.trigger-function-zip.output_path
    source_code_hash = data.archive_file.trigger-function-zip.output_base64sha256

    runtime = "nodejs20.x"

    layers = [ var.layer_arn ]

    publish = var.environment == "prod"

    environment {
        variables = {
            ALARM_TABLE_NAME = var.alarm_table_name
            TRASH_SCHEDULE_TABLE_NAME = var.trash_schedule_table_name
            GOOGLE_APPLICATION_CREDENTIALS= "/var/task/firebase-config.json"
        }

    }

    logging_config {
        log_format = "JSON"
        log_group = aws_cloudwatch_log_group.throwtrash-alarm-trigger-log-group.name
    }
    tags = local.tags
}

resource "aws_lambda_alias" "throwtrash-trigger-dev" {
    name            = "dev"
    function_name   = aws_lambda_function.throwtrash-alarm-trigger-lambda.function_name
    function_version = "$LATEST"
}

resource "aws_lambda_alias" "throwtrash-trigger-prod" {
    count = var.environment == "prod" ? 1 : 0
    name            = "prod"
    function_name   = aws_lambda_function.throwtrash-alarm-trigger-lambda.function_name
    function_version = aws_lambda_function.throwtrash-alarm-trigger-lambda.version
}

output "alarm_trigger_lambda_arn" {
    value = aws_lambda_function.throwtrash-alarm-trigger-lambda.arn
}