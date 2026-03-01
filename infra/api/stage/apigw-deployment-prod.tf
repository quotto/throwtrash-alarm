resource "aws_api_gateway_deployment" "api-deployment-prod" {
    rest_api_id = var.api_gateway["api_id"]
}