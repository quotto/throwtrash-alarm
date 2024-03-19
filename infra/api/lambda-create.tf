data "archive_file" "create-function-zip" {
  type        = "zip"
  source_dir  = "${path.root}/../app/packages/api/create/dist"
  output_path = "${path.module}/app-create.zip"
}

resource "aws_lambda_function" "throwtrash-alarm-create-lambda" {
    function_name = "throwtrash-alarm-create"
    role          = aws_iam_role.throwtrash-alarm-lambda-role.arn
    handler       = "api/create/controller.handler"

    filename      = data.archive_file.create-function-zip.output_path
    source_code_hash = data.archive_file.create-function-zip.output_base64sha256

    runtime = "nodejs20.x"

    layers = [var.layer_arn]

    logging_config {
        log_format = "JSON"
        log_group = aws_cloudwatch_log_group.throwtrash-alarm-log-group.name
    }

    environment {
        variables = {
            ALARM_TABLE_NAME = aws_dynamodb_table.throwtrash-alarm-table.name,
            EVENT_BRIDGE_SCHEDULER_GROUP_NAME = aws_scheduler_schedule_group.throwtrash-alarm-schedule-group.name,
            ALARM_TRIGGER_FUNCTION_ARN = var.alarm_trigger_lambda_arn
						ALARM_TRIGGER_FUNCTION_ROLE_ARN = aws_iam_role.throwtrash-alarm-scheduler-role.arn
        }
    }

    tags = local.tags
}

resource "aws_lambda_permission" "throwtrash-create-permission-apigw" {
    action        = "lambda:InvokeFunction"
    function_name = aws_lambda_function.throwtrash-alarm-create-lambda.function_name
    qualifier = "dev"
    principal     = "apigateway.amazonaws.com"
    source_arn   = "${aws_api_gateway_rest_api.api.execution_arn}/*/${aws_api_gateway_method.api-method-post.http_method}/${aws_api_gateway_resource.api-resource-create.path_part}"
}