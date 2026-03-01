# OpenAPI

- 仕様書: `docs/openapi/alarm-api.yaml`
- 対象: `create` / `update` / `delete` API
- 互換性:
  - `next_day_notification_enabled` は任意項目
  - create で未指定時は `false`
  - update で未指定時は既存値を維持
