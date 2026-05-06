# GenDrop

Generative Video Flow — p5.js を録画し、YouTube Shorts 向けに加工するパイプラインです。

## リポジトリ

- https://github.com/hiroshiandailab/gendrop

ローカルでクローン済みの場合、`origin` が古いユーザー名のままなら次で更新してください。

```bash
git remote set-url origin https://github.com/hiroshiandailab/gendrop.git
git remote -v
```

SSH の場合:

```bash
git remote set-url origin git@github.com:hiroshiandailab/gendrop.git
```

## GitHub Pages

ユーザー／組織サイトの URL は **`hiroshiandailab.github.io`** になります。

- リポジトリをサイトとして公開している場合の例:  
  https://hiroshiandailab.github.io/gendrop/
- 特定スケッチの例:  
  https://hiroshiandailab.github.io/gendrop/sketches/001-ma-26039/

（実際のパスはリポジトリの Pages 設定に合わせてください。）

## Google Cloud OAuth（Drive 連携）

`automation/auth-setup.js` でリフレッシュトークンを取得するときのリダイレクト URI は次の固定値です（GitHub のユーザー名とは無関係です）。

- **承認済みのリダイレクト URI**: `http://localhost:3000/oauth2callback`

Google Cloud Console → **API とサービス** → **認証情報** → 使用中の OAuth 2.0 クライアントで、上記 URI が登録されていれば、GitHub アカウント名変更後もそのまま利用できます。

もし検証用に **GitHub Pages の URL** を「承認済みの JavaScript 生成元」やリダイレクト URI に追加していた場合は、`hiroshiandai.github.io` を **`hiroshiandailab.github.io`** に書き換えて保存してください。

GitHub Actions での Drive アップロードはリポジトリの Secrets（`GOOGLE_OAUTH_*`）を使用するため、**ユーザー名変更だけでは Secrets の再登録は不要**です（別アカウントに移した場合は別途対応が必要です）。

## 動画出力（Shorts + フル尺 9:16）

1回の録画ジョブで **2種類の MP4** を生成します。

| 出力 | ファイル名 | 用途 |
|------|------------|------|
| YouTube Shorts 向け | `SKETCH-shorts.mp4` | いこれまでどおり、ブラー背景付きの 1080×1920。ソースは **960×540 ビューポート**からの短いクリップ（`start_time` / `duration`）。 |
| アーカイブ用フル尺 | `SKETCH-full.mp4` | **1080×1920 ビューポート**で、アニメーションの **はじめから 1 周おわりまで** を録画した WebM をそのままエンコードし、レターボックスで **正確に 9:16** に収めた高ビットレート H.264（CRF 16 / preset slow）。**録画秒をワークフロー入力で決めるのではなく**、次の優先順で「1 周の長さ」を決めます。 |

- **1 周の長さ（フル尺の尺）**の優先順位: **①** スケッチが `window.__GENDROP_LOOP_SEC`（秒）または `window.__GENDROP_LOOP_FRAMES`（録画 fps で割って秒に換算）を設定している場合はそれを採用 → **②** `meta.json` の **`animation_loop_seconds`**（なければ後方互換で **`loop_seconds`**）→ **③** ローカル／緊急用に `record.js` の **第6引数**（任意）→ **④** 環境変数 **`GENDROP_ANIMATION_LOOP_DEFAULT`**（なければ旧名 **`GENDROP_FULL_LOOP_DEFAULT`**）→ **⑤** 既定 **90**（**0.5〜600** 秒にクランプ）。フル尺 MP4 は **`full-raw.webm` の実長**に合わせ、`-t` で切り詰めません。
- Google Drive にフル尺も上げる場合はリポジトリ Secrets に **`DRIVE_FULL_FOLDER_ID`**（`GenDrop/full` フォルダの ID）を追加してください。**GenDrop - Record** ではフル尺 MP4 が生成されているのにこの Secret が空だと **アップロードは失敗**します（設定漏れに気づけます）。フルだけ不要なときは Record の入力 **`skip_full_drive_upload`** を `true` にします。検証用 **verify-all** では従来どおり Secret が無ければフルのアップロードのみスキップします。

## スケジュール実行（毎晩 Google Chat 通知）

ワークフロー **「GenDrop - Scheduled Nightly Notify」**（`.github/workflows/scheduled.yml`）は **録画・Drive には触れません**（それらは **GenDrop - Record** の手動実行のみ）。

1. `sketches/` 以下に **`.txt` がある場合**: その中から **ランダムに 1 ファイル**を選び、本文を Google Chat に投稿します。  
2. **`.txt` が 1 つもない場合**: スケッチフォルダから **ランダムに 1 本**選び、`generate-metadata.js`（Gemini）で **`SKETCH_ID-post.txt`** を生成してから、その内容を Chat に投稿します（このとき **`GEMINI_API_KEY`** が必要です）。

**Cron**: デフォルト **毎日 11:00 UTC**（**日本時間 20:00**）。変更する場合は YAML の `cron` を編集してください。

**Chat のオン／オフ**: リポジトリ **Settings → Secrets and variables → Actions → Variables** に **`GENDROP_CHAT_NOTIFY`** を追加し、無効にしたいときだけ値を **`false`**（または **`0`**）にします。未設定のときは通知対象として扱います（Webhook が無ければ投稿はスキップされ、ジョブは成功で終わります）。

**Webhook**: Secrets に **`GOOGLE_CHAT_WEBHOOK_URL`**（Google Chat の受信 Webhook URL）を登録します。未設定の場合、投稿は行われず成功で終了します。

**手動テスト**: Actions タブから **Run workflow** を実行できます。入力 **`chat_notify`** に `true` / `false` を入れると、その回だけ Variable を上書きします（空欄なら Variable の値を使用）。
