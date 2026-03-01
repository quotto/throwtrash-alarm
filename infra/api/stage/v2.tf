resource "aws_api_gateway_stage" "api-stage-prod-v2" {
    rest_api_id = var.api_gateway["api_id"]
    stage_name = "v2"
    deployment_id = aws_api_gateway_deployment.api-deployment-prod.id
    variables = {
      "stageName" = "v2"
    }
    tags = local.tags

    lifecycle {
      ignore_changes = [ tags ]
    }
}

resource "aws_api_gateway_usage_plan" "usage-plan-prod-v2" {
    name = "throwtrash-alarm-prod-plan"
    api_stages {
        api_id = var.api_gateway["api_id"]
        stage = aws_api_gateway_stage.api-stage-prod-v2.stage_name
    }
}

resource "aws_api_gateway_api_key" "api-key-prod-v2" {
    name = "throwtrash-alarm-prod-key"
}

resource "aws_api_gateway_usage_plan_key" "api-plan-key-prod-v2" {
    usage_plan_id = aws_api_gateway_usage_plan.usage-plan-prod-v2.id
    key_type = "API_KEY"
    key_id = aws_api_gateway_api_key.api-key-prod-v2.id
}


resource "aws_lambda_permission" "throwtrash-create-permission-apigw-v2" {
    action          = "lambda:InvokeFunction"
    function_name   = var.create_lambda["name"]
    qualifier       = aws_lambda_alias.throwtrash-create-alias-v2.name
    principal       = "apigateway.amazonaws.com"
    source_arn      = "${var.api_gateway["execution_arn"]}/*/${var.api_gateway["post_method"]}/${var.api_gateway["create_path_part"]}"
}

resource "aws_lambda_permission" "throwtrash-delete-permission-apigw-v2" {
    action          = "lambda:InvokeFunction"
    function_name   = var.delete_lambda["name"]
    qualifier       = aws_lambda_alias.throwtrash-delete-alias-v2.name
    principal       = "apigateway.amazonaws.com"
    source_arn      = "${var.api_gateway["execution_arn"]}/*/${var.api_gateway["delete_method"]}/${var.api_gateway["delete_path_part"]}"
}


resource "aws_lambda_permission" "throwtrash-update-permission-apigw-v2" {
    action          = "lambda:InvokeFunction"
    function_name   = var.update_lambda["name"]
    qualifier       = aws_lambda_alias.throwtrash-update-alias-v2.name
    principal       = "apigateway.amazonaws.com"
    source_arn      = "${var.api_gateway["execution_arn"]}/*/${var.api_gateway["put_method"]}/${var.api_gateway["update_path_part"]}"
}

resource "aws_lambda_alias" "throwtrash-create-alias-v2" {
    name = aws_api_gateway_stage.api-stage-prod-v2.stage_name
    function_name = var.create_lambda["name"]
    function_version = var.create_lambda["version"]
}

resource "aws_lambda_alias" "throwtrash-delete-alias-v2" {
    name = aws_api_gateway_stage.api-stage-prod-v2.stage_name
    function_name = var.delete_lambda["name"]
    function_version = var.delete_lambda["version"]
}

resource "aws_lambda_alias" "throwtrash-update-alias-v2" {
    name = aws_api_gateway_stage.api-stage-prod-v2.stage_name
    function_name = var.update_lambda["name"]
    function_version = var.update_lambda["version"]
}

resource "aws_api_gateway_base_path_mapping" "api-base-path-mapping-v2" {
  api_id      = var.api_gateway.api_id
  stage_name  = aws_api_gateway_stage.api-stage-prod-v2.stage_name
  domain_name = aws_api_gateway_domain_name.api-domain-name.domain_name
  base_path   = aws_api_gateway_stage.api-stage-prod-v2.stage_name
}