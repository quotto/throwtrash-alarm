output "create_lambda" {
    value = {
        name = "${aws_lambda_function.throwtrash-alarm-create-lambda.function_name}"
        version = "${aws_lambda_function.throwtrash-alarm-create-lambda.version}"
    }
}

output "delete_lambda" {
    value = {
        name = "${aws_lambda_function.throwtrash-alarm-delete-lambda.function_name}"
        version = "${aws_lambda_function.throwtrash-alarm-delete-lambda.version}"
    }
}


output "update_lambda" {
    value = {
        name = "${aws_lambda_function.throwtrash-alarm-update-lambda.function_name}"
        version = "${aws_lambda_function.throwtrash-alarm-update-lambda.version}"
    }
}

output "api_gateway" {
    value = {
        api_id = "${aws_api_gateway_rest_api.api.id}"
        execution_arn = "${aws_api_gateway_rest_api.api.execution_arn}"
        post_method = "${aws_api_gateway_method.api-method-post.http_method}"
        delete_method = "${aws_api_gateway_method.api-method-delete.http_method}"
        put_method = "${aws_api_gateway_method.api-method-put.http_method}"
        create_path_part = "${aws_api_gateway_resource.api-resource-create.path_part}"
        delete_path_part = "${aws_api_gateway_resource.api-resource-delete.path_part}"
        update_path_part = "${aws_api_gateway_resource.api-resource-update.path_part}"
    }
}