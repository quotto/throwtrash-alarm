data "archive_file" "trigger-function-zip" {
    type        = "zip"
    source_dir  = "${path.root}/../alarm-trigger/dist"
    output_path = "${path.module}/alarm-trigger.zip"
}
resource "aws_lambda_function" "throwtrash-alarm-trigger-lambda" {
    function_name = "throwtrash-alarm-trigger"
    role          = aws_iam_role.throwtrash-alarm-trigger-lambda-role.arn
    handler       = "index.handler"

    filename      = data.archive_file.trigger-function-zip.output_path
    source_code_hash = data.archive_file.trigger-function-zip.output_base64sha256

    runtime = "nodejs20.x"

    logging_config {
        log_format = "JSON"
    }
    tags = local.tags
}

output "alarm_trigger_lambda_arn" {
    value = aws_lambda_function.throwtrash-alarm-trigger-lambda.arn
}