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
