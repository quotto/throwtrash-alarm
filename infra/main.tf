module "api" {
  source = "./api"
  alarm_trigger_lambda_arn = module.alarm-trigger.alarm_trigger_lambda_arn
}

module "alarm-trigger" {
  source = "./alarm-trigger"
  alarm_table_arn = module.api.alarm_table_arn
}