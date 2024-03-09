resource "aws_cloudwatch_log_group" "throwtrash-alarm-log-group" {
  name = "/aws/lambda/throwtrash-alarm"
  tags = local.tags
  lifecycle {
    ignore_changes = [tags]
  }
}