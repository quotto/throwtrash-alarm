resource "aws_cloudwatch_log_group" "throwtrash-alarm-trigger-log-group" {
  name = "/aws/lambda/throwtrash-alarm-trigger"
  tags = local.tags
  lifecycle {
    ignore_changes = [tags]
  }
}