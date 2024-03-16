data "archive_file" "delete-function-zip" {
  type        = "zip"
  source_dir  = "${path.root}/../app/packages/api/delete/dist"
  output_path = "${path.module}/app-delete.zip"
}

resource "aws_lambda_function" "throwtrash-alarm-delete-lambda" {
    function_name = "throwtrash-alarm-delete"
    role          = aws_iam_role.throwtrash-alarm-lambda-role.arn
    handler       = "api/delete/controller.handler"

    filename      = data.archive_file.delete-function-zip.output_path
    source_code_hash = data.archive_file.delete-function-zip.output_base64sha256

    runtime = "nodejs20.x"

    layers = [aws_lambda_layer_version.layer.arn]

    logging_config {
        log_format = "JSON"
        log_group = aws_cloudwatch_log_group.throwtrash-alarm-log-group.name
    }

    environment {
        variables = {
            ALARM_TABLE_NAME = aws_dynamodb_table.throwtrash-alarm-table.name,
        }
    }

    tags = local.tags
}

resource "aws_lambda_permission" "throwtrash-delete-permission-apigw" {
    action        = "lambda:InvokeFunction"
    function_name = aws_lambda_function.throwtrash-alarm-delete-lambda.function_name
    qualifier = "dev"
    principal     = "apigateway.amazonaws.com"
    source_arn   = "${aws_api_gateway_rest_api.api.execution_arn}/*/${aws_api_gateway_method.api-method-delete.http_method}/${aws_api_gateway_resource.api-resource-delete.path_part}"
}