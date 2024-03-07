locals {
  tags = {
    app   = "throwtrash"
    group = "alarm"
  }
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}