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
| アーカイブ用フル尺 | `SKETCH-full.mp4` | **1080×1920 ビューポート**で **冒頭から `loop_seconds` 秒**を録画し、レターボックスで **正確に 9:16** に収めた高ビットレート H.264（CRF 16 / preset slow）。 |

- **ループ長**の優先順位: コマンド第6引数（ワークフローの `full_loop_seconds`）→ 各スケッチの `meta.json` の **`loop_seconds`** → 環境変数 `GENDROP_FULL_LOOP_DEFAULT` → 既定 **90**（上限 600 秒）。
- Google Drive にフル尺も上げる場合はリポジトリ Secrets に **`DRIVE_FULL_FOLDER_ID`**（フォルダ ID）を追加してください。未設定のときはショート・サムネ・メタのみアップロードされます。

## スケジュール実行とローテーション（C-2）

ワークフロー **「GenDrop - Scheduled Daily Rotation」**（`.github/workflows/scheduled.yml`）が次を行います。

1. `sketches/` 内フォルダ名をソートした順序で、`automation/state.json` の **`cursor`** が指す作品を選ぶ  
2. 録画 → FFmpeg → Gemini メタデータ → Drive アップロード（既存の単体 Record と同じパイプライン）  
3. 成功したときだけ **`cursor` を 1 進め**、`state.json` を `main` にコミットしてプッシュ  

**Cron**: デフォルトで **毎日 06:00 UTC**（おおよそ **日本時間 15:00**）。変更する場合は YAML の `cron` を編集してください。

**手動テスト**: Actions タブから **Run workflow** を実行できます。ローテーションを進めたくないときは **`skip_advance`: true** にすると、`state.json` は更新されません。

**ブランチ保護**: `main` への直接プッシュが禁止されている場合、`github-actions[bot]` のプッシュが弾かれることがあります。そのときは保護ルールで bot を許可するか、別の更新手段（例: 専用ブランチと PR）に切り替えてください。
