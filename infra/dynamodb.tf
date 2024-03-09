resource "aws_dynamodb_table" "throwtrash-alarm-table" {
  name           = "throwtrash-alarm"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "device_token"
  attribute {
    name = "device_token"
    type = "S"
  }
  attribute {
    name = "alarm_time"
    type = "S"
  }
  global_secondary_index {
    name              = "alarm_time_index"
    hash_key           = "alarm_time"
    projection_type    = "INCLUDE"
    non_key_attributes = [ "device_token","user_id" ]
  }
  tags = local.tags
}