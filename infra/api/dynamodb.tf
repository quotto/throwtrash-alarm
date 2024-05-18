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
    non_key_attributes = [ "device_token","user_id","platform","created_at","last_successful_time","last_failed_time" ]
  }
  tags = local.tags
}

output "alarm_table_arn" {
  value = aws_dynamodb_table.throwtrash-alarm-table.arn
}

output "alarm_table_name" {
  value = aws_dynamodb_table.throwtrash-alarm-table.name
}