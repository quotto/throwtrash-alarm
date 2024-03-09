data "archive_file" "update-function-zip" {
  type        = "zip"
  source_dir  = "${path.root}/../app/dist"
  output_path = "${path.root}/app-update.zip"
  excludes = ["api/create","api/delete","layer"]
}

resource "aws_lambda_function" "throwtrash-alarm-update-lambda" {
    function_name = "throwtrash-alarm-update"
    role          = aws_iam_role.throwtrash-alarm-lambda-role.arn
    handler       = "api/update/controller.handler"

    filename      = data.archive_file.update-function-zip.output_path
    source_code_hash = data.archive_file.update-function-zip.output_base64sha256

    runtime = "nodejs20.x"

    layers = [aws_lambda_layer_version.layer.arn]

    logging_config {
        log_format = "JSON"
        log_group = aws_cloudwatch_log_group.throwtrash-alarm-log-group.name
    }

    environment {
        variables = {
            TABLE_NAME = "Alarm"
        }
    }

    tags = local.tags
}

resource "aws_lambda_permission" "throwtrash-update-permission-apigw" {
    action        = "lambda:InvokeFunction"
    function_name = aws_lambda_function.throwtrash-alarm-update-lambda.function_name
    principal     = "apigateway.amazonaws.com"
    source_arn   = "${aws_api_gateway_rest_api.api.execution_arn}/*"
}