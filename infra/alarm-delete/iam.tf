data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_iam_policy_document" "lambda_assume_role_policy" {
    statement {
        actions = ["sts:AssumeRole"]
        principals {
            type        = "Service"
            identifiers = ["lambda.amazonaws.com"]
        }
    }
}

resource "aws_iam_role" "throwtrash-alarm-delete-lambda-role" {
    name               = "throwtrash-alarm-delete-lambda-role"
    assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy.json
    tags = local.tags
}

resource "aws_iam_policy" "throwtrash-alarm-delete-lambda-policy" {
    name   = "throwtrash-alarm-delete-lambda-policy"
    policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "DynamoDBPolicy",
            "Action": [
                "dynamodb:*"
            ],
            "Effect": "Allow",
            "Resource": [
                "${var.alarm_table_arn}",
                "${var.alarm_table_arn}/*"
            ]
        },
        {
            "Sid": "SQSPolicy",
            "Action": [
                "sqs:ReceiveMessage",
                "sqs:DeleteMessage",
                "sqs:GetQueueAttributes"
            ],
            "Effect": "Allow",
            "Resource": [
                "${aws_sqs_queue.alarm_delete_queue.arn}"
            ]
        },
        {
            "Sid": "CloudWatchPolicy",
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": [
                "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${aws_lambda_function.throwtrash-alarm-delete-lambda.function_name}:*"
            ]
        }
    ]
}
EOF
    tags = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda-policy-attachment" {
    role = aws_iam_role.throwtrash-alarm-delete-lambda-role.name
    policy_arn = aws_iam_policy.throwtrash-alarm-delete-lambda-policy.arn
}
