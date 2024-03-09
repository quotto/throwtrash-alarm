resource "aws_scheduler_schedule_group" "throwtrash-alarm-schedule-group" {
  name = "throwtrash-alarm-schedule-group"
  tags = local.tags
}