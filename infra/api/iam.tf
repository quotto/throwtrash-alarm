data "aws_iam_policy_document" "lambda_assume_role_policy" {
    statement {
        actions = ["sts:AssumeRole"]
        principals {
            type        = "Service"
            identifiers = ["lambda.amazonaws.com"]
        }
    }
}

resource "aws_iam_role" "throwtrash-alarm-lambda-role" {
    name               = "throwtrash-alarm-lambda-role"
    assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy.json
    tags = local.tags
}

resource "aws_iam_policy" "throwtrash-alarm-lambda-policy" {
    name   = "throwtrash-alarm-lambda-policy"
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
                "${aws_dynamodb_table.throwtrash-alarm-table.arn}"
            ]
        },
        {
            "Sid": "SchedulerPolicy",
            "Action": [
                "scheduler:*"
            ],
            "Effect": "Allow",
            "Resource": [
                "arn:aws:scheduler:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:schedule/${aws_scheduler_schedule_group.throwtrash-alarm-schedule-group.name}/*"
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
                "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/throwtrash-alarm:*"
            ]
        },
        {
            "Sid": "PassRolePolicy",
            "Effect": "Allow",
            "Action": "iam:PassRole",
            "Resource": [
                "${aws_iam_role.throwtrash-alarm-scheduler-role.arn}"
            ]
        }
    ]
}
EOF
    tags = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda-policy-attachment" {
    role = aws_iam_role.throwtrash-alarm-lambda-role.name
    policy_arn = aws_iam_policy.throwtrash-alarm-lambda-policy.arn
}

// EventBridge SchedulerがLambdaを実行するためのポリシーとロールを作成
data "aws_iam_policy_document" "scheduler-assume-role-policy" {
    statement {
        actions = ["sts:AssumeRole"]
        principals {
            type        = "Service"
            identifiers = ["scheduler.amazonaws.com"]
        }
    }
}

resource "aws_iam_role" "throwtrash-alarm-scheduler-role" {
    name               = "throwtrash-alarm-scheduler-role"
    assume_role_policy = data.aws_iam_policy_document.scheduler-assume-role-policy.json
    tags = local.tags

}
resource "aws_iam_policy" "throwtrash-alarm-scheduler-policy" {
    name   = "throwtrash-alarm-scheduler-policy"
    policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "LambdaPolicy",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Effect": "Allow",
            "Resource": [
                "${var.alarm_trigger_lambda_arn}"
            ]
        }
    ]
}
EOF
    tags = local.tags
}

resource "aws_iam_role_policy_attachment" "scheduler-policy-attachment" {
    role = aws_iam_role.throwtrash-alarm-scheduler-role.name
    policy_arn = aws_iam_policy.throwtrash-alarm-scheduler-policy.arn
}
