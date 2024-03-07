data "archive_file" "create-function-zip" {
  type        = "zip"
  source_dir  = "${path.root}/app"
  output_path = "${path.root}/app/app.zip"
  excludes = ["__tests__","api/update","api/delete"]
}

resource "aws_lambda_function" "throwtrash-alarm-create-lambda" {
    function_name = "throwtrash-alarm-create"
    role          = aws_iam_role.throwtrash-alarm-lambda-role.arn
    handler       = "dist/index.handler"

    filename      = data.archive_file.create-function-zip.output_path
    source_code_hash = data.archive_file.create-function-zip.output_base64sha256

    runtime = "nodejs20.x"

    environment {
        variables = {
            TABLE_NAME = "Alarm"
        }
    }

    tags = local.tags
}

resource "aws_lambda_permission" "throwtrash-create-permission-apigw" {
    action        = "lambda:InvokeFunction"
    function_name = aws_lambda_function.throwtrash-alarm-create-lambda.function_name
    principal     = "apigateway.amazonaws.com"
    source_arn   = aws_api_gateway_rest_api.api.execution_arn
}