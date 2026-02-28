# 明日ゴミ出し通知 機能追加計画

## 1. 目的
- iOS アプリから設定されるアラームに「翌日のゴミ出し通知」フラグを追加する。
- フラグ有効時は、通知判定を「当日基準」ではなく「翌日基準」で実行する。
- 通知タイトルを `明日出せるゴミ` にする。
- 旧 API/旧データとの互換性を維持する。
- iOS 側実装のため OpenAPI ドキュメントを新規作成する。

## 2. 対象範囲
- アプリケーション
  - `app/packages/api/create/src/index.mts`
  - `app/packages/api/update/src/index.mts`
  - `app/packages/core/src/entity/alarm.mts`
  - `app/packages/core/src/infra/dynamodb-alarm-repository.mts`
  - `app/packages/core/src/usecase/alarm-service.mts`
  - `app/packages/core/src/usecase/trigger-service.mts`
  - `app/packages/core/src/entity/device-message.mts`
  - `app/packages/core/src/infra/fcm-sender.mts`
- テスト
  - `app/packages/core/__tests__/usecase/trigger-service.test.mts`
  - `app/packages/core/__tests__/infra/dynamodb-alarm-repository.test.mts`
  - 必要に応じて API ハンドラのテスト追加
- ドキュメント
  - `docs/openapi/alarm-api.yaml`（新規）
  - `docs/openapi/README.md`（必要なら新規）

## 3. 互換性方針
- 追加フィールドはオプショナルで扱う。
- 旧クライアント（フラグ未送信）時は既存挙動を維持する。
  - 既定値: `next_day_notification_enabled = false`
- 既存の DynamoDB レコードにフィールドが無くても読み込み可能にする。
- API レスポンス形式は既存を維持する（破壊的変更をしない）。

## 4. 設計方針
- API 仕様
  - `create` / `update` リクエストに `next_day_notification_enabled: boolean` を追加。
  - 未指定時は `false` として保存。
- ドメインモデル
  - `Alarm` に翌日通知フラグを保持するプロパティを追加。
  - 更新 API でフラグ更新可能にする。
- 永続化
  - `DynamoDBAlarmRepository` の `AlarmItem` にフラグを追加。
  - 取得時は欠損を `false` 補完。
- 通知生成
  - `trigger-service` のスケジュール判定日をアラームごとに切替。
    - `false`: `calculateLocalTime(0)`（当日）
    - `true`: `calculateLocalTime(1)`（翌日）
  - フラグに応じた通知タイトルを `DeviceMessage` で保持し、`FcmSender` へ渡す。
    - 翌日通知: `明日出せるゴミ`
    - 既存通知: 既存タイトル（当日）

## 5. 実装ステップ
1. API 契約と型更新
2. ドメイン・リポジトリへのフラグ追加（互換性込み）
3. トリガー判定日と通知タイトル切替の実装
4. 単体テスト更新/追加
5. OpenAPI ドキュメント作成
6. 検証（build/test）

## 6. 検証計画
- `cd app`
- `npm run test -w @shared/core`
- `npm run test -w @function/create -w @function/update`（テストがある場合）
- `npm run build`

確認観点:
- フラグ未指定時に既存挙動を維持すること。
- フラグ有効時に翌日基準で判定されること。
- FCM タイトルが `明日出せるゴミ` になること。
- 既存レコード読み込みで例外にならないこと。

## 7. 体制
- `agent_main`: 全体統括、仕様判断、最終マージ判断
- `agent_api_contract`: API 入出力と OpenAPI 管理
- `agent_domain_core`: ドメイン/ユースケース/互換性実装
- `agent_notification`: FCM メッセージ生成・送信実装
- `agent_test_quality`: テスト設計・回帰確認

進め方:
- API 契約を先に固定し、ドメインと通知を並行実装。
- 互換性テストを最優先で通したうえで、OpenAPI を確定する。
