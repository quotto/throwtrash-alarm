output "sqs_url" {
    value = aws_sqs_queue.alarm_delete_queue.url
}

output "sqs_arn" {
    value = aws_sqs_queue.alarm_delete_queue.arn
}