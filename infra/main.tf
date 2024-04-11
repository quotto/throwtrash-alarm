variable "trash_schedule_table_arn" {
  type        = string
}

variable "trash_schedule_table_name" {
  type        = string
}

module "layer" {
  source = "./shared"
}

module "api" {
  source = "./api"
  alarm_trigger_lambda_arn = module.alarm-trigger.alarm_trigger_lambda_arn
  layer_arn = module.layer.layer_arn
}

module "alarm-trigger" {
  source = "./alarm-trigger"
  alarm_table_arn = module.api.alarm_table_arn
  alarm_table_name = module.api.alarm_table_name
  trash_schedule_table_arn =  var.trash_schedule_table_arn
  trash_schedule_table_name = var.trash_schedule_table_name
  layer_arn = module.layer.layer_arn
}