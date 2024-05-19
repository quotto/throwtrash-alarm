variable "environment" {
    description = "The environment to deploy the API to"
    type        = string
    default = "dev"
}

variable "create_lambda" {
    type = object({
      name = string
      version = string
    })
}

variable "delete_lambda" {
    type = object({
      name = string
      version = string
    })
}

variable "update_lambda" {
    type = object({
      name = string
      version = string
    })
}

variable "api_gateway" {
    type = object({
      api_id = string
      execution_arn = string
      post_method = string
      delete_method = string
      put_method = string
      create_path_part = string
      delete_path_part = string
      update_path_part = string
    })
}

variable "certificate_arn" {
    type        = string
}

variable "zone_id" {
    type        = string
}

variable "api_gateway_zone_id" {
    type        = string
    default     = "Z1YSHQZHG15GKL"
}

variable "api_gateway_custom_domain" {
    type        = string
}

locals {
    tags = {
        app = "throwtrash"
        group = "alarm"
    }
}
