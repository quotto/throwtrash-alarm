resource "aws_api_gateway_domain_name" "api-domain-name" {
  domain_name              = "alarm.mythrowaway.net"
  regional_certificate_arn = var.certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_route53_record" "route53-record" {
  name    = aws_api_gateway_domain_name.api-domain-name.domain_name
  type    = "A"
  zone_id = var.zone_id

  alias {
    evaluate_target_health = true
    name                   = var.api_gateway_custom_domain
    zone_id                = var.api_gateway_zone_id
  }
}
