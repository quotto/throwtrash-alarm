resource "aws_dynamodb_table" "alarm_table" {
  name           = "alarm"
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
  attribute {
    name = "user_id"
    type = "S"
  }
  global_secondary_index {
    name              = "alarm_time_index"
    hash_key           = "alarm_time"
    projection_type    = "INCLUDE"
    non_key_attributes = [ "user_id" ]
  }
  tags = {
    app = "throwtrash"
    group = "alarm"
  }
}