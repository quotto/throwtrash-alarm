resource "aws_cloudwatch_log_group" "throwtrash-alarm-delete-log-group" {
  name = "/aws/lambda/throwtrash-alarm-delete"
  tags = local.tags
  lifecycle {
    ignore_changes = [tags]
  }
}
