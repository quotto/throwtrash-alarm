variable "trash_schedule_table_arn" {
  type        = string
}

variable "trash_schedule_table_name" {
  type        = string
}

variable "environment" {
  type        = string
  default = "dev"
}

variable "zone_id" {
  type        = string
}

variable "certificate_arn" {
  type        = string
}

module "layer" {
  source = "./shared"
}

module "api" {
  source = "./api"
  alarm_trigger_lambda_arn = module.alarm-trigger.alarm_trigger_lambda_arn
  layer_arn = module.layer.layer_arn
  environment = var.environment
}

module "alarm-trigger" {
  source = "./alarm-trigger"
  alarm_table_arn = module.api.alarm_table_arn
  alarm_table_name = module.api.alarm_table_name
  trash_schedule_table_arn =  var.trash_schedule_table_arn
  trash_schedule_table_name = var.trash_schedule_table_name
  layer_arn = module.layer.layer_arn
}

module "api-gateway-prod-stage" {
  count = var.environment == "prod" ? 1 : 0
  source = "./api/stage"
  environment = var.environment
  api_gateway = module.api.api_gateway
  create_lambda = module.api.create_lambda
  delete_lambda = module.api.delete_lambda
  update_lambda = module.api.update_lambda
  zone_id = var.zone_id
  certificate_arn = var.certificate_arn
}