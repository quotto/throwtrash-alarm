resource "aws_api_gateway_rest_api" "api" {
    name = "throwtrash-alarm"
    api_key_source = "HEADER"
    endpoint_configuration {
        types = ["REGIONAL"]
    }
    tags = local.tags
    lifecycle {
      ignore_changes = [ tags ]
    }
}

resource "aws_api_gateway_stage" "api-stage-dev" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    stage_name = "dev"
    deployment_id = aws_api_gateway_deployment.api-deployment-dev.id
    variables = {
      "stageName" = "dev"
    }
    tags = local.tags
    lifecycle {
      ignore_changes = [ tags ]
    }
}

resource "aws_api_gateway_resource" "api-resource-create" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    parent_id = aws_api_gateway_rest_api.api.root_resource_id
    path_part = "create"
}

resource "aws_api_gateway_method" "api-method-post" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.api-resource-create.id
    http_method = "POST"
    authorization = "NONE"
    api_key_required = true
}

resource "aws_api_gateway_resource" "api-resource-delete" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    parent_id = aws_api_gateway_rest_api.api.root_resource_id
    path_part = "delete"
}

resource "aws_api_gateway_method" "api-method-delete" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.api-resource-delete.id
    http_method = "DELETE"
    authorization = "NONE"
    api_key_required = true
}

resource "aws_api_gateway_resource" "api-resource-update" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    parent_id = aws_api_gateway_rest_api.api.root_resource_id
    path_part = "update"
}

resource "aws_api_gateway_method" "api-method-put" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.api-resource-update.id
    http_method = "PUT"
    authorization = "NONE"
    api_key_required = true
}

resource "aws_api_gateway_integration" "api-integration-create" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.api-resource-create.id
    http_method = aws_api_gateway_method.api-method-post.http_method
    integration_http_method = aws_api_gateway_method.api-method-post.http_method
    type = "AWS_PROXY"
    uri = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${aws_lambda_function.throwtrash-alarm-create-lambda.arn}:$${stageVariables.stageName}/invocations"
    passthrough_behavior = "WHEN_NO_TEMPLATES"
}

resource "aws_api_gateway_integration" "api-integration-delete" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.api-resource-delete.id
    http_method = aws_api_gateway_method.api-method-delete.http_method
    // AWS Lambdaの呼び出しはPOSTのみが許可されるため、API側のメソッドに関わらずPOSTを指定する
    integration_http_method = "POST"
    type = "AWS_PROXY"
    uri = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${aws_lambda_function.throwtrash-alarm-delete-lambda.arn}:$${stageVariables.stageName}/invocations"
    passthrough_behavior = "WHEN_NO_TEMPLATES"
}

resource "aws_api_gateway_integration" "api-integration-update" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.api-resource-update.id
    http_method = aws_api_gateway_method.api-method-put.http_method
    // AWS Lambdaの呼び出しはPOSTのみが許可されるため、API側のメソッドに関わらずPOSTを指定する
    integration_http_method = "POST"
    type = "AWS_PROXY"
    uri = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${aws_lambda_function.throwtrash-alarm-update-lambda.arn}:$${stageVariables.stageName}/invocations"
    passthrough_behavior = "WHEN_NO_TEMPLATES"
}

resource "aws_api_gateway_deployment" "api-deployment-dev" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    depends_on = [
        aws_api_gateway_integration.api-integration-create,
        aws_api_gateway_integration.api-integration-delete,
        aws_api_gateway_integration.api-integration-update
    ]
    triggers = {
        redeployment = sha1(jsonencode([
            aws_api_gateway_integration.api-integration-create.id,
            aws_api_gateway_integration.api-integration-delete.id,
            aws_api_gateway_integration.api-integration-update.id,
            aws_api_gateway_method.api-method-post.id,
            aws_api_gateway_method.api-method-put.id,
            aws_api_gateway_method.api-method-delete.id,
            aws_api_gateway_resource.api-resource-create.id
        ]))
    }
}

resource "aws_api_gateway_usage_plan" "usage-plan-dev" {
    name = "throwtrash-alarm-dev-plan"
    api_stages {
        api_id = aws_api_gateway_rest_api.api.id
        stage = aws_api_gateway_stage.api-stage-dev.stage_name
    }
}

resource "aws_api_gateway_api_key" "api-key-dev" {
    name = "throwtrash-alarm-dev-key"
}

resource "aws_api_gateway_usage_plan_key" "api-plan-key-dev" {
    usage_plan_id = aws_api_gateway_usage_plan.usage-plan-dev.id
    key_type = "API_KEY"
    key_id = aws_api_gateway_api_key.api-key-dev.id
}