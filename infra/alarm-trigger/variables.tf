variable "alarm_table_arn" {
  type        = string
}
variable "alarm_table_name" {
  type        = string
}
variable "trash_schedule_table_name" {
  type        = string
}
variable "shared_trash_schedule_table_name" {
  type        = string
}
variable "layer_arn" {
  type        = string
}
variable "environment" {
  type        = string
  default = "dev"
}
variable "delete-failed-alarms-sqs-arn" {
  type        = string
}
variable "delete-failed-alarms-sqs-url" {
  type        = string
}