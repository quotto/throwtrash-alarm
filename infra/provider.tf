provider "aws" {
  region = "ap-northeast-1"
}
terraform {
   required_providers {
     aws = {
       source  = "hashicorp/aws"
       version = "~> 3.0"
     }
   }
  backend "s3" {
      bucket = "throwtrash-tfstate-ap-northeast-1"
      key    = "alarm.tfstate"
      region = "ap-northeast-1"
    }
}