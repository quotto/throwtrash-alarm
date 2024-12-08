variable "alarm_table_arn" {
  type        = string
}
variable "alarm_table_name" {
  type        = string
}
variable "layer_arn" {
  type        = string
}
variable "environment" {
  type        = string
  default = "dev"
}

variable "tags" {
  type = object({
    app = string
    group = string
  })
  default = {
    app = "throwtrash"
    group = "alarm"
  }
}