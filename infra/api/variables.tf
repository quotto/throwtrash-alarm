variable "alarm_trigger_lambda_arn" {
  type        = string
}

variable "layer_arn" {
  type        = string
}

variable "environment" {
  type        = string
  default = "dev"
}