resource "aws_cloudwatch_log_group" "throwtrash-alarm-delete-log-group" {
  name = "/aws/lambda/${local.function_name}"
  tags = var.tags
  lifecycle {
    ignore_changes = [tags]
  }
}
