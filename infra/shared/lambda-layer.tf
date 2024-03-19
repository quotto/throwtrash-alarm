data "archive_file" "layer_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../app/node_modules"
  output_path = "${path.module}/layer.zip"
}

resource "aws_lambda_layer_version" "layer" {
  layer_name    = "throwtrash-alarm-libs"
  skip_destroy = true
  compatible_runtimes = ["nodejs20.x"]
  filename = data.archive_file.layer_zip.output_path
  source_code_hash = "${data.archive_file.layer_zip.output_base64sha256}"
}

output layer_arn {
  value = aws_lambda_layer_version.layer.arn
}