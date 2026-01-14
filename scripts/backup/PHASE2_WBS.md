# SharePoint自動バックアップ実装 WBS（Phase 2）

## プロジェクト概要
本番データベースのバックアップをGitHub Actionsで自動実行し、SharePointに保存する仕組みを構築する。

---

## 1. 事前準備・承認取得

| タスクID | タスク名 | 担当者 | 作業内容 | 所要時間 | 状態 |
|---------|---------|--------|---------|---------|------|
| 1.1 | SharePoint利用承認取得 | **実作業者** | 社内でSharePoint利用の承認を取得 | 1-2週間 | ⬜️ |
| 1.2 | Azure AD管理者の特定 | **実作業者** | Azure ADアプリ登録権限を持つ管理者を特定 | 1日 | ⬜️ |

### 📋 タスク1.1: SharePoint利用承認取得

**作業場所:** 社内承認フロー

**詳細手順:**

1. **承認申請書類の準備**
   - 目的: 本番データベースのバックアップファイル保存
   - 使用するSharePointサイト: [会社名]-[部署名]
   - 必要な容量: 約500MB/月（4スキーマ × 約50MB × 月2回）
   - 保存期間: 6ヶ月分（約3GB）

2. **承認ルートの確認**
   - システム管理部門の承認者を確認
   - SharePoint管理者の承認も必要な場合は追加

3. **申請提出**
   - 社内の申請システムから提出
   - 承認待ち期間: 通常1-2週間

**アウトプット:**
- ✅ SharePoint利用承認（書面またはメール）
- ✅ 使用するSharePointサイトURL

---

### 📋 タスク1.2: Azure AD管理者の特定

**作業場所:** 社内システム管理部門

**詳細手順:**

1. **Azure AD管理者の確認**
   - 社内のIT部門/システム管理部門に問い合わせ
   - 「Azure ADアプリケーション登録」権限を持つ担当者を確認

2. **連絡先の記録**
   - 担当者名、メールアドレス、部署名をメモ
   - 依頼テンプレート（後述）の準備

**アウトプット:**
- ✅ Azure AD管理者の連絡先
- ✅ 依頼メールのドラフト作成

---

## 2. SharePoint環境設定

| タスクID | タスク名 | 担当者 | 作業内容 | 依存関係 | 状態 |
|---------|---------|--------|---------|---------|------|
| 2.1 | SharePointサイト確認 | **SharePoint管理者** | バックアップ保存先のSharePointサイトURLを確認 | 1.1完了後 | ⬜️ |
| 2.2 | バックアップフォルダ作成 | **SharePoint管理者** | `Shared Documents/DB-Backups` フォルダを作成 | 2.1完了後 | ⬜️ |
| 2.3 | フォルダ権限設定確認 | **SharePoint管理者** | アプリケーションが書き込めるよう権限設定を確認 | 2.2完了後 | ⬜️ |

---

### 📋 タスク2.1: SharePointサイト確認

**担当者:** SharePoint管理者

**作業場所:** SharePoint管理センター または SharePointサイト

**詳細手順:**

1. **SharePointサイトへアクセス**
   - ブラウザで会社のSharePointホームページを開く
   - 例: `https://yourcompany.sharepoint.com`

2. **対象サイトの確認**
   - 左メニュー → 「サイト」または「Sites」
   - バックアップ用に使用するチームサイトを選択
   - 例: 「IT部門」「開発チーム」など

3. **サイトURLの記録**
   - ブラウザのアドレスバーからURLをコピー
   - 例: `https://yourcompany.sharepoint.com/sites/IT-Team`
   - このURLを実作業者に共有

**アウトプット:**
- ✅ SharePointサイトURL（例: `https://yourcompany.sharepoint.com/sites/IT-Team`）

---

### 📋 タスク2.2: バックアップフォルダ作成

**担当者:** SharePoint管理者

**作業場所:** SharePoint対象サイト

**詳細手順:**

1. **ドキュメントライブラリを開く**
   - タスク2.1で確認したSharePointサイトを開く
   - 左メニュー → 「ドキュメント」または「Documents」をクリック
   - 画面に「Shared Documents」が表示される

2. **新しいフォルダを作成**
   - 上部メニューバー → 「+ 新規」ボタンをクリック
   - ドロップダウンメニュー → 「フォルダー」を選択
   - ダイアログが表示される

3. **フォルダ名の入力**
   - 名前フィールドに `DB-Backups` と入力（ハイフン付き、正確に）
   - 「作成」ボタンをクリック

4. **フォルダパスの確認**
   - 作成したフォルダをクリックして開く
   - ブラウザのアドレスバーを確認
   - パスが `Shared Documents/DB-Backups` になっていることを確認
   - または左ナビゲーションパンくずに表示される

5. **実作業者への情報共有**
   - フォルダパス: `Shared Documents/DB-Backups`
   - フォルダURL: ブラウザのアドレスバーからコピー

**確認ポイント:**
- [ ] フォルダ名が `DB-Backups`（ハイフン付き）であることを確認
- [ ] パスが `Shared Documents/DB-Backups` であることを確認
- [ ] フォルダが空であることを確認

**アウトプット:**
- ✅ フォルダパス: `Shared Documents/DB-Backups`

---

### 📋 タスク2.3: フォルダ権限設定確認

**担当者:** SharePoint管理者

**作業場所:** SharePoint対象サイト（DB-Backupsフォルダ）

**詳細手順:**

1. **フォルダの権限画面を開く**
   - `DB-Backups` フォルダを右クリック
   - メニュー → 「詳細」または「Details」をクリック
   - 右側にパネルが表示される
   - パネル上部の「︙」（縦3点）→ 「アクセス許可の管理」をクリック

2. **現在の権限を確認**
   - 権限を持つユーザー/グループの一覧が表示される
   - 通常は親フォルダ（Shared Documents）から権限を継承している

3. **アプリケーション権限について**
   - **注意**: この時点ではまだAzure ADアプリが作成されていないため、アプリへの権限付与は不要
   - タスク3.5でAPI権限 `Sites.ReadWrite.All` を付与することで、アプリが自動的にこのフォルダへ書き込み可能になる
   - 特別な権限設定は不要（デフォルトのままでOK）

4. **実作業者への共有**
   - 「権限は親フォルダから継承、特別な設定は不要」と伝える

**確認ポイント:**
- [ ] フォルダの権限画面が開けることを確認
- [ ] 親フォルダから権限を継承していることを確認
- [ ] 特別な権限変更は行わない（Azure ADアプリのAPI権限で自動的にアクセス可能）

**アウトプット:**
- ✅ 権限設定確認完了の報告

---

### 📧 SharePoint管理者への依頼メールテンプレート

**件名:** DBバックアップ用SharePointフォルダ作成依頼

```
[SharePoint管理者名] 様

お世話になっております。[あなたの名前]です。

データベースバックアップ自動化のため、SharePointにフォルダを作成いただきたく、ご依頼いたします。

【作成いただきたいフォルダ】
- サイト: [サイトURL（承認で確認したURL）]
- フォルダパス: Shared Documents/DB-Backups
- フォルダ名: DB-Backups（ハイフン付き）

【用途】
- 本番データベースのバックアップファイル（.dmpファイル）を自動保存
- GitHub Actionsから月2回（1日・15日）自動アップロード
- ファイルサイズ: 約200MB/回（4ファイル）

【権限について】
- 通常の権限設定で問題ありません
- Azure ADアプリ「DB-Backup-Uploader」（後日登録予定）がAPI経由でアクセスします

【作成後にご共有いただきたい情報】
1. SharePointサイトのフルURL
2. 作成したフォルダのパス確認

お手数をおかけしますが、よろしくお願いいたします。

---
[あなたの名前]
[部署名]
[メールアドレス]
```

---

## 3. Azure AD設定

| タスクID | タスク名 | 担当者 | 作業内容 | 依存関係 | 状態 |
|---------|---------|--------|---------|---------|------|
| 3.1 | Azure Portalへログイン | **Azure AD管理者** | https://portal.azure.com にアクセス | - | ⬜️ |
| 3.2 | テナントID確認 | **Azure AD管理者** | Azure Active Directory → Overview → Tenant ID を記録 | 3.1完了後 | ⬜️ |
| 3.3 | アプリケーション登録 | **Azure AD管理者** | App registrations → New registration で登録 | 3.2完了後 | ⬜️ |
| 3.4 | アプリケーションID取得 | **Azure AD管理者** | Application (client) ID を記録 | 3.3完了後 | ⬜️ |
| 3.5 | API権限付与 | **Azure AD管理者** | Sites.ReadWrite.All を追加し管理者の同意を付与 | 3.4完了後 | ⬜️ |
| 3.6 | クライアントシークレット作成 | **Azure AD管理者** | Certificates & secrets でシークレット作成 | 3.5完了後 | ⬜️ |
| 3.7 | 認証情報の引き渡し | **Azure AD管理者** | Tenant ID、Client ID、Client Secret を実作業者に共有 | 3.6完了後 | ⬜️ |

---

### 📋 タスク3.1: Azure Portalへログイン

**担当者:** Azure AD管理者

**作業場所:** Webブラウザ

**詳細手順:**

1. **Azure Portalを開く**
   - ブラウザで https://portal.azure.com にアクセス
   - 会社のMicrosoftアカウントでサインイン

2. **正しいテナントを確認**
   - 画面右上のアカウントアイコンをクリック
   - 「ディレクトリの切り替え」で会社のテナントを選択
   - テナント名が正しいことを確認

**アウトプット:**
- ✅ Azure Portalにログイン完了
- ✅ 正しいテナントを選択済み

---

### 📋 タスク3.2: テナントID確認

**担当者:** Azure AD管理者

**作業場所:** Azure Portal

**詳細手順:**

1. **Azure Active Directoryを開く**
   - 画面左上の「≡」（ハンバーガーメニュー）をクリック
   - メニューから「Azure Active Directory」をクリック
   - または検索バー（上部）に「Azure Active Directory」と入力して選択

2. **概要ページを表示**
   - 左メニューで「概要」または「Overview」が選択されていることを確認
   - 画面中央に基本情報が表示される

3. **テナントIDをコピー**
   - 「基本情報」セクションを探す
   - 「テナント ID」または「Tenant ID」の行を見つける
   - 値の形式: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`（UUID形式）
   - 値の右側にある「📋」（コピーアイコン）をクリック
   - または値を選択してCtrl+C（Mac: Cmd+C）でコピー

4. **テナントIDの記録**
   - テキストファイルまたはメモアプリに貼り付け
   - ファイル名: `azure-ad-credentials.txt`（ローカルに保存、Gitには入れない）

```
# Azure AD認証情報（実作業者に共有する）
Tenant ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**確認ポイント:**
- [ ] テナントIDがUUID形式（ハイフン区切り）であることを確認
- [ ] コピーした値に余分なスペースや改行がないことを確認

**アウトプット:**
- ✅ Tenant ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

### 📋 タスク3.3: アプリケーション登録

**担当者:** Azure AD管理者

**作業場所:** Azure Portal - Azure Active Directory

**詳細手順:**

1. **App registrationsを開く**
   - Azure Active Directoryの画面（タスク3.2の続き）
   - 左メニュー → 「アプリの登録」または「App registrations」をクリック

2. **新規登録を開始**
   - 上部メニューバー → 「+ 新規登録」または「+ New registration」ボタンをクリック
   - 「アプリケーションの登録」画面が表示される

3. **アプリケーション情報を入力**

   **a. 名前（Name）**
   - フィールド: 「名前」または「Name」
   - 入力値: `DB-Backup-Uploader`（正確に）
   - 説明: このアプリの用途を示す名前

   **b. サポートされているアカウントの種類（Supported account types）**
   - ラジオボタンを選択:
     - ✅ 「この組織ディレクトリのみに含まれるアカウント ([会社名] のみ - シングルテナント)」
     - 英語: 「Accounts in this organizational directory only ([Company Name] only - Single tenant)」
   - 他のオプションは選択しない

   **c. リダイレクトURI（Redirect URI）**
   - このフィールドは**空欄のまま**にする
   - GitHub Actionsからの自動実行なのでWebアプリケーションではないため不要

4. **登録を実行**
   - 画面下部の「登録」または「Register」ボタンをクリック
   - 処理が完了するまで数秒待つ

5. **登録完了画面の確認**
   - 登録が完了すると、アプリケーションの「概要」ページが表示される
   - 画面上部に「DB-Backup-Uploader」というアプリ名が表示されていることを確認

**確認ポイント:**
- [ ] アプリ名が `DB-Backup-Uploader` であることを確認
- [ ] アカウントタイプが「シングルテナント」であることを確認
- [ ] 概要ページが表示されていることを確認

**アウトプット:**
- ✅ アプリケーション登録完了
- ✅ 概要ページが表示されている

---

### 📋 タスク3.4: アプリケーションID取得

**担当者:** Azure AD管理者

**作業場所:** Azure Portal - App registrations - DB-Backup-Uploader

**詳細手順:**

1. **概要ページの確認**
   - タスク3.3の続き、またはApp registrations → 「DB-Backup-Uploader」をクリック
   - 左メニューで「概要」または「Overview」が選択されていることを確認

2. **Application (client) IDをコピー**
   - 「要点」または「Essentials」セクションを探す
   - 「アプリケーション (クライアント) ID」または「Application (client) ID」の行を見つける
   - 値の形式: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`（UUID形式）
   - 値の右側にある「📋」（コピーアイコン）をクリック
   - または値を選択してCtrl+C（Mac: Cmd+C）でコピー

3. **Application IDの記録**
   - タスク3.2で作成した `azure-ad-credentials.txt` に追記

```
# Azure AD認証情報（実作業者に共有する）
Tenant ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Application (Client) ID: yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
```

**確認ポイント:**
- [ ] Application IDがUUID形式（ハイフン区切り）であることを確認
- [ ] Tenant IDと異なる値であることを確認（混同注意）

**アウトプット:**
- ✅ Application (Client) ID: `yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy`

---

### 📋 タスク3.5: API権限付与

**担当者:** Azure AD管理者

**作業場所:** Azure Portal - App registrations - DB-Backup-Uploader

**詳細手順:**

1. **API権限ページを開く**
   - アプリ「DB-Backup-Uploader」の画面
   - 左メニュー → 「APIのアクセス許可」または「API permissions」をクリック

2. **現在の権限を確認**
   - デフォルトで「Microsoft Graph - User.Read」が表示されている（これは使用しない）

3. **新しい権限を追加**
   - 上部メニュー → 「+ アクセス許可の追加」または「+ Add a permission」をクリック
   - 「APIアクセス許可の要求」パネルが右側に表示される

4. **Microsoft Graphを選択**
   - パネルの「Microsoft API」タブが選択されていることを確認
   - 一覧から「Microsoft Graph」をクリック

5. **アプリケーション権限を選択**
   - 「アクセス許可の種類」で2つのオプションが表示される:
     - 「委任されたアクセス許可」（使用しない）
     - **「アプリケーションの許可」**（こちらを選択）
   - 「アプリケーションの許可」をクリック

6. **Sites権限を検索**
   - 検索ボックス（「アクセス許可を選択」）に `Sites` と入力
   - 「Sites」カテゴリが展開される

7. **Sites.ReadWrite.Allを選択**
   - 「Sites」カテゴリ内の一覧を確認
   - ✅ `Sites.ReadWrite.All` のチェックボックスをONにする
   - 説明: 「Have full control of all site collections」と表示される
   - 他のSites権限（Sites.Read.All など）は選択しない

8. **権限を追加**
   - パネル下部の「アクセス許可の追加」または「Add permissions」ボタンをクリック
   - パネルが閉じる

9. **追加された権限を確認**
   - API権限一覧に戻る
   - `Sites.ReadWrite.All` が追加されていることを確認
   - 状態列に「[会社名]に管理者の同意が必要です」または「Admin consent required for [Company]」と表示される

10. **管理者の同意を付与（最重要）**
    - 上部メニュー → 「[会社名]に管理者の同意を与えます」または「Grant admin consent for [Company]」ボタンをクリック
    - 確認ダイアログが表示される: 「このアプリケーションに対して要求されたアクセス許可への管理者の同意を付与しますか?」
    - 「はい」または「Yes」をクリック

11. **同意の完了を確認**
    - 画面が更新される
    - `Sites.ReadWrite.All` の「状態」列が変更される:
      - 変更前: 「管理者の同意が必要です」
      - 変更後: ✅ **「[会社名]に付与されました」**（緑のチェックマーク）
    - この緑のチェックマークが表示されていることが必須

**確認ポイント:**
- [ ] `Sites.ReadWrite.All` が追加されている
- [ ] 種類が「Application」であることを確認
- [ ] 状態に緑のチェックマーク「[会社名]に付与されました」が表示されている
- [ ] User.Read権限（委任）も残っているが、これは問題ない

**⚠️ 重要な注意事項:**
- 「管理者の同意を与える」をクリックしないと、GitHub Actionsからのアクセスが失敗します
- 緑のチェックマークが表示されるまで、必ず確認してください

**アウトプット:**
- ✅ API権限 `Sites.ReadWrite.All` が追加され、管理者の同意が付与された

---

### 📋 タスク3.6: クライアントシークレット作成

**担当者:** Azure AD管理者

**作業場所:** Azure Portal - App registrations - DB-Backup-Uploader

**詳細手順:**

1. **証明書とシークレットページを開く**
   - アプリ「DB-Backup-Uploader」の画面
   - 左メニュー → 「証明書とシークレット」または「Certificates & secrets」をクリック

2. **新しいクライアントシークレットを作成**
   - 画面中央の「クライアントシークレット」または「Client secrets」タブが選択されていることを確認
   - 「+ 新しいクライアント シークレット」または「+ New client secret」ボタンをクリック
   - 右側に「クライアント シークレットの追加」パネルが表示される

3. **シークレット情報を入力**

   **a. 説明（Description）**
   - フィールド: 「説明」または「Description」
   - 入力値: `DB Backup Script`
   - この名前は後で識別するためのもの

   **b. 有効期限（Expires）**
   - ドロップダウンから選択:
     - オプション: 「6か月」「12か月」「24か月」「カスタム」
     - **推奨: 「24か月」を選択**（2年後に更新が必要）
   - 有効期限が切れるとバックアップが失敗するため、期限を記録しておく

4. **シークレットを追加**
   - パネル下部の「追加」または「Add」ボタンをクリック
   - パネルが閉じて一覧に戻る

5. **シークレット値をコピー（重要）**
   - 新しいシークレットが一覧に追加される
   - 「値」または「Value」列に長い文字列が表示される
   - ⚠️ **この値は今この瞬間だけ表示され、後で再表示できません**
   - 値の右側にある「📋」（コピーアイコン）をクリック
   - または値を選択してCtrl+C（Mac: Cmd+C）でコピー

6. **シークレット値の記録**
   - `azure-ad-credentials.txt` に即座に追記

```
# Azure AD認証情報（実作業者に共有する）
Tenant ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Application (Client) ID: yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
Client Secret: zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz
Client Secret 有効期限: 2027年01月06日
```

7. **有効期限の記録**
   - 「有効期限」列に表示されている日付を記録
   - カレンダーやリマインダーに登録（更新が必要な日付）

**確認ポイント:**
- [ ] Client Secretの値をコピーしたことを確認
- [ ] `azure-ad-credentials.txt` に貼り付けたことを確認
- [ ] 有効期限を記録したことを確認
- [ ] 値が表示されなくなった場合は、新しいシークレットを再作成する

**⚠️ 重要な注意事項:**
- **Client Secretは1回しか表示されません**
- 画面を閉じたり更新すると二度と表示されなくなります
- コピーし忘れた場合は、古いシークレットを削除して新しいものを作成してください

**アウトプット:**
- ✅ Client Secret: `zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz`
- ✅ 有効期限が記録されている

---

### 📋 タスク3.7: 認証情報の引き渡し

**担当者:** Azure AD管理者

**作業場所:** メールまたは社内チャット

**詳細手順:**

1. **認証情報ファイルの最終確認**
   - `azure-ad-credentials.txt` を開く
   - 3つの値が全て記録されていることを確認:
     - Tenant ID
     - Application (Client) ID
     - Client Secret

2. **安全な共有方法を選択**

   **推奨方法（セキュリティレベル順）:**

   a. **社内セキュアメッセージングツール**
   - Microsoft Teams、Slack（プライベートDM）
   - 暗号化された社内チャットツール

   b. **暗号化メール**
   - メール本文に直接記載せず、パスワード付きZIPまたは暗号化ツールを使用

   c. **対面または電話**
   - 機密情報なので、可能であれば対面で伝える

3. **実作業者へメッセージ送信**

```
[実作業者名] 様

Azure ADアプリケーション「DB-Backup-Uploader」の登録が完了しました。
以下の認証情報を共有いたします。

【Azure AD認証情報】
Tenant ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Application (Client) ID: yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
Client Secret: zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz
Client Secret 有効期限: 2027年01月06日

【重要事項】
- これらの情報は機密情報です。GitHubのSecretsにのみ保存してください
- ローカルファイルやGitリポジトリには保存しないでください
- Client Secretは2027年01月06日に有効期限が切れますので、更新が必要です

【実施済みの設定】
✅ アプリケーション登録完了
✅ API権限 Sites.ReadWrite.All 付与
✅ 管理者の同意付与済み

以上、よろしくお願いいたします。

---
[Azure AD管理者名]
```

4. **自分のコピーを削除**
   - 実作業者への送信が完了したら
   - `azure-ad-credentials.txt` を削除
   - ゴミ箱も空にする（セキュリティのため）

**確認ポイント:**
- [ ] 3つの値が正確に共有されている
- [ ] 安全な方法で送信した
- [ ] 実作業者から受領確認をもらった
- [ ] ローカルの認証情報ファイルを削除した

**アウトプット:**
- ✅ 認証情報を実作業者に安全に共有完了

---

### 📧 Azure AD管理者への依頼メールテンプレート

**件名:** DBバックアップ用Azure ADアプリケーション登録依頼

```
[Azure AD管理者名] 様

お世話になっております。[あなたの名前]です。

データベースバックアップ自動化のため、Azure ADアプリケーションの登録をお願いしたく、ご依頼いたします。

【アプリケーション情報】
- アプリ名: DB-Backup-Uploader
- アカウントタイプ: この組織ディレクトリのみ（シングルテナント）
- リダイレクトURI: 不要（GitHub Actionsからの自動実行のため）

【必要なAPI権限】
- Microsoft Graph - Application permissions
- Sites.ReadWrite.All
- ⚠️ 「管理者の同意」の付与が必須です

【作成後にご共有いただきたい情報】
以下3点を安全な方法（Teams DMなど）で共有をお願いします：
1. Tenant ID
2. Application (Client) ID
3. Client Secret（有効期限: 24ヶ月を推奨）

【用途】
GitHub ActionsからSharePointへデータベースバックアップファイル（.dmpファイル）を自動アップロードします。
- 実行頻度: 月2回（毎月1日・15日 深夜3時）
- アクセス先: [SharePointサイトURL]
- 保存先フォルダ: Shared Documents/DB-Backups

【参考資料】
詳細な手順書を添付しております（PHASE2_WBS.md）。
セクション3をご参照ください。

お手数をおかけしますが、よろしくお願いいたします。

---
[あなたの名前]
[部署名]
[メールアドレス]
```

---

## 4. 本番DB接続情報取得

| タスクID | タスク名 | 担当者 | 作業内容 | 依存関係 | 状態 |
|---------|---------|--------|---------|---------|------|
| 4.1 | 本番DB接続情報取得 | **システム管理者** | Railwayの本番環境から`DATABASE_URL`を取得 | - | ⬜️ |
| 4.2 | 接続情報の引き渡し | **システム管理者** | `DATABASE_URL_PRODUCTION` を実作業者に安全に共有 | 4.1完了後 | ⬜️ |

---

### 📋 タスク4.1: 本番DB接続情報取得

**担当者:** システム管理者

**作業場所:** Railway管理画面

**詳細手順:**

1. **Railwayにログイン**
   - ブラウザで https://railway.app/ にアクセス
   - 「Login」ボタンをクリック
   - GitHubアカウント連携でログイン

2. **本番環境プロジェクトを開く**
   - ダッシュボードに表示されるプロジェクト一覧から本番環境を選択
   - プロジェクト名: 「shift-scheduler-ai-production」など
   - 環境: 「production」タグがついているもの

3. **PostgreSQLサービスを選択**
   - プロジェクト画面に複数のサービスが表示される
   - 「PostgreSQL」アイコンをクリック
   - データベース情報画面が表示される

4. **Variablesタブを開く**
   - サービス画面上部のタブから「Variables」をクリック
   - 環境変数の一覧が表示される

5. **DATABASE_URLをコピー**
   - 一覧から `DATABASE_URL` を探す
   - 値の形式: `postgresql://postgres:パスワード@ホスト名:ポート/database`
   - 値の右側にある「📋」（コピーアイコン）をクリック
   - または値をクリックして表示 → 全選択 → コピー

6. **接続情報の記録**
   - テキストファイルに貼り付け: `database-credentials.txt`（ローカル保存）

```
# 本番DB接続情報（実作業者に共有する）
DATABASE_URL_PRODUCTION=postgresql://postgres:xxxxx@yyyy.railway.app:5432/railway
```

**確認ポイント:**
- [ ] URLが `postgresql://` で始まっていることを確認
- [ ] ホスト名に `railway.app` が含まれていることを確認
- [ ] パスワード部分が含まれていることを確認（`@`の前）

**アウトプット:**
- ✅ DATABASE_URL: `postgresql://postgres:xxxxx@yyyy.railway.app:5432/railway`

---

### 📋 タスク4.2: 接続情報の引き渡し

**担当者:** システム管理者

**作業場所:** メールまたは社内チャット

**詳細手順:**

1. **接続情報の最終確認**
   - `database-credentials.txt` を開く
   - DATABASE_URLが正しく記録されていることを確認

2. **実作業者へ安全に共有**
   - 推奨: Microsoft Teams DM、社内セキュアチャット
   - 避ける: 平文メール、Slack公開チャンネル

```
[実作業者名] 様

本番データベースの接続情報を共有します。

DATABASE_URL_PRODUCTION=postgresql://postgres:xxxxx@yyyy.railway.app:5432/railway

【注意事項】
- この情報は機密情報です
- GitHubのSecretsにのみ保存してください
- ローカルファイルやリポジトリには保存しないでください

以上、よろしくお願いいたします。

---
[システム管理者名]
```

3. **ローカルファイル削除**
   - 送信完了後、`database-credentials.txt` を削除
   - ゴミ箱を空にする

**アウトプット:**
- ✅ DATABASE_URL_PRODUCTIONを実作業者に共有完了

---

## 5. GitHub設定

| タスクID | タスク名 | 担当者 | 作業内容 | 依存関係 | 状態 |
|---------|---------|--------|---------|---------|------|
| 5.1 | GitHub Secretsに移動 | **実作業者** | GitHub Repository → Settings → Secrets | - | ⬜️ |
| 5.2 | AZURE_TENANT_ID設定 | **実作業者** | New repository secret で追加 | 3.7完了後 | ⬜️ |
| 5.3 | AZURE_CLIENT_ID設定 | **実作業者** | New repository secret で追加 | 3.7完了後 | ⬜️ |
| 5.4 | AZURE_CLIENT_SECRET設定 | **実作業者** | New repository secret で追加 | 3.7完了後 | ⬜️ |
| 5.5 | SHAREPOINT_SITE_URL設定 | **実作業者** | New repository secret で追加 | 2.1完了後 | ⬜️ |
| 5.6 | SHAREPOINT_FOLDER_PATH設定 | **実作業者** | New repository secret で追加 | 2.2完了後 | ⬜️ |
| 5.7 | DATABASE_URL_PRODUCTION設定 | **実作業者** | New repository secret で追加 | 4.2完了後 | ⬜️ |

---

### 📋 タスク5.1: GitHub Secretsに移動

**担当者:** 実作業者

**作業場所:** GitHubリポジトリ

**詳細手順:**

1. **GitHubリポジトリを開く**
   - ブラウザで https://github.com/The-botch/shift-scheduler-ai を開く
   - GitHubにログインしていることを確認

2. **Settingsタブを開く**
   - リポジトリ画面上部のタブバーから「Settings」をクリック
   - ⚠️ 「Settings」が表示されない場合は、リポジトリへの管理者権限がありません（権限を確認）

3. **Secrets and variablesを開く**
   - 左サイドバーの「Security」セクションを探す
   - 「Secrets and variables」をクリックして展開
   - 「Actions」をクリック

4. **Repository secretsページの確認**
   - 画面に「Actions secrets and variables」というタイトルが表示される
   - 「Repository secrets」タブが選択されていることを確認
   - 既存のシークレット一覧（あれば）が表示される

**確認ポイント:**
- [ ] 「Settings」タブが表示されている
- [ ] 「Repository secrets」画面が開いている
- [ ] 「New repository secret」ボタンが表示されている

**アウトプット:**
- ✅ GitHub Secrets設定画面にアクセス完了

---

### 📋 タスク5.2: AZURE_TENANT_ID設定

**担当者:** 実作業者

**作業場所:** GitHub Repository Secrets

**詳細手順:**

1. **新規シークレット作成を開始**
   - 「New repository secret」ボタン（画面右上）をクリック
   - 「New secret」フォームが表示される

2. **シークレット名を入力**
   - 「Name」フィールドに以下を**正確に**入力: `AZURE_TENANT_ID`
   - ⚠️ 大文字小文字、アンダースコアの位置に注意
   - スペースや余分な文字を入れない

3. **シークレット値を入力**
   - 「Secret」フィールドをクリック
   - Azure AD管理者から受け取ったTenant IDを貼り付け
   - 例: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - 前後に余分なスペースや改行がないことを確認

4. **シークレットを追加**
   - 「Add secret」ボタン（画面下部・緑色）をクリック
   - 「Repository secrets」一覧に戻る
   - 追加した `AZURE_TENANT_ID` が表示される

**確認ポイント:**
- [ ] シークレット名が `AZURE_TENANT_ID` であることを確認
- [ ] 一覧に追加されたことを確認
- [ ] 値は「*****」で表示され、実際の内容は見えない（正常）

**アウトプット:**
- ✅ AZURE_TENANT_ID設定完了

---

### 📋 タスク5.3: AZURE_CLIENT_ID設定

**担当者:** 実作業者

**作業場所:** GitHub Repository Secrets

**詳細手順:**

1. **新規シークレット作成**
   - 「New repository secret」ボタンをクリック

2. **シークレット名を入力**
   - 「Name」: `AZURE_CLIENT_ID`（正確に）

3. **シークレット値を入力**
   - 「Secret」: Azure AD管理者から受け取ったApplication (Client) ID
   - 例: `yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy`

4. **シークレットを追加**
   - 「Add secret」ボタンをクリック

**確認ポイント:**
- [ ] シークレット名が `AZURE_CLIENT_ID` であることを確認
- [ ] 一覧に追加されたことを確認

**アウトプット:**
- ✅ AZURE_CLIENT_ID設定完了

---

### 📋 タスク5.4: AZURE_CLIENT_SECRET設定

**担当者:** 実作業者

**作業場所:** GitHub Repository Secrets

**詳細手順:**

1. **新規シークレット作成**
   - 「New repository secret」ボタンをクリック

2. **シークレット名を入力**
   - 「Name」: `AZURE_CLIENT_SECRET`（正確に）

3. **シークレット値を入力**
   - 「Secret」: Azure AD管理者から受け取ったClient Secret
   - 例: `zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz`
   - ⚠️ この値は長い文字列です。全体がコピーされていることを確認

4. **シークレットを追加**
   - 「Add secret」ボタンをクリック

**確認ポイント:**
- [ ] シークレット名が `AZURE_CLIENT_SECRET` であることを確認
- [ ] 値が長い文字列であることを確認（短すぎる場合はコピーミス）
- [ ] 一覧に追加されたことを確認

**アウトプット:**
- ✅ AZURE_CLIENT_SECRET設定完了

---

### 📋 タスク5.5: SHAREPOINT_SITE_URL設定

**担当者:** 実作業者

**作業場所:** GitHub Repository Secrets

**詳細手順:**

1. **新規シークレット作成**
   - 「New repository secret」ボタンをクリック

2. **シークレット名を入力**
   - 「Name」: `SHAREPOINT_SITE_URL`（正確に）

3. **シークレット値を入力**
   - 「Secret」: SharePoint管理者から受け取ったサイトURL
   - 例: `https://yourcompany.sharepoint.com/sites/IT-Team`
   - ⚠️ 末尾にスラッシュ `/` を付けない
   - ⚠️ `https://` で始まることを確認

4. **シークレットを追加**
   - 「Add secret」ボタンをクリック

**確認ポイント:**
- [ ] シークレット名が `SHAREPOINT_SITE_URL` であることを確認
- [ ] URLが `https://` で始まっていることを確認
- [ ] 末尾にスラッシュがないことを確認
- [ ] 一覧に追加されたことを確認

**アウトプット:**
- ✅ SHAREPOINT_SITE_URL設定完了

---

### 📋 タスク5.6: SHAREPOINT_FOLDER_PATH設定

**担当者:** 実作業者

**作業場所:** GitHub Repository Secrets

**詳細手順:**

1. **新規シークレット作成**
   - 「New repository secret」ボタンをクリック

2. **シークレット名を入力**
   - 「Name」: `SHAREPOINT_FOLDER_PATH`（正確に）

3. **シークレット値を入力**
   - 「Secret」: `Shared Documents/DB-Backups`（正確に）
   - ⚠️ スペースの位置に注意（`Shared` と `Documents` の間）
   - ⚠️ `DB-Backups` のハイフンに注意
   - ⚠️ 先頭や末尾にスラッシュ `/` を付けない

4. **シークレットを追加**
   - 「Add secret」ボタンをクリック

**確認ポイント:**
- [ ] シークレット名が `SHAREPOINT_FOLDER_PATH` であることを確認
- [ ] 値が `Shared Documents/DB-Backups` であることを確認（スペル確認）
- [ ] 一覧に追加されたことを確認

**アウトプット:**
- ✅ SHAREPOINT_FOLDER_PATH設定完了

---

### 📋 タスク5.7: DATABASE_URL_PRODUCTION設定

**担当者:** 実作業者

**作業場所:** GitHub Repository Secrets

**詳細手順:**

1. **新規シークレット作成**
   - 「New repository secret」ボタンをクリック

2. **シークレット名を入力**
   - 「Name」: `DATABASE_URL_PRODUCTION`（正確に）

3. **シークレット値を入力**
   - 「Secret」: システム管理者から受け取ったDATABASE_URL
   - 例: `postgresql://postgres:xxxxx@yyyy.railway.app:5432/railway`
   - ⚠️ 全体を漏れなくコピー（パスワード部分も含む）

4. **シークレットを追加**
   - 「Add secret」ボタンをクリック

5. **全Secretsの確認**
   - 「Repository secrets」一覧に以下6つが表示されていることを確認:
     1. AZURE_TENANT_ID
     2. AZURE_CLIENT_ID
     3. AZURE_CLIENT_SECRET
     4. SHAREPOINT_SITE_URL
     5. SHAREPOINT_FOLDER_PATH
     6. DATABASE_URL_PRODUCTION

**確認ポイント:**
- [ ] シークレット名が `DATABASE_URL_PRODUCTION` であることを確認
- [ ] 値が `postgresql://` で始まっていることを確認
- [ ] 6つ全てのSecretsが設定されていることを確認

**アウトプット:**
- ✅ DATABASE_URL_PRODUCTION設定完了
- ✅ 全6つのGitHub Secrets設定完了

---

### 📊 設定する環境変数一覧（チェックリスト）

| Secret名 | 値の例 | 取得元 | 状態 |
|---------|--------|--------|------|
| `AZURE_TENANT_ID` | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | タスク3.2 | ⬜️ |
| `AZURE_CLIENT_ID` | `yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy` | タスク3.4 | ⬜️ |
| `AZURE_CLIENT_SECRET` | `zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz` | タスク3.6 | ⬜️ |
| `SHAREPOINT_SITE_URL` | `https://yourcompany.sharepoint.com/sites/IT-Team` | タスク2.1 | ⬜️ |
| `SHAREPOINT_FOLDER_PATH` | `Shared Documents/DB-Backups` | タスク2.2 | ⬜️ |
| `DATABASE_URL_PRODUCTION` | `postgresql://postgres:xxxxx@yyyy.railway.app:5432/railway` | タスク4.1 | ⬜️ |

---

## 6. GitHub Actionsワークフロー有効化

| タスクID | タスク名 | 担当者 | 作業内容 | 依存関係 | 状態 |
|---------|---------|--------|---------|---------|------|
| 6.1 | ワークフローファイル編集 | **実作業者** | `.github/workflows/db-backup-to-sharepoint.yml` のコメントアウトを全て解除 | 5.7完了後 | ⬜️ |
| 6.2 | コミット・プッシュ | **実作業者** | 変更をコミットしてGitHubにプッシュ | 6.1完了後 | ⬜️ |

---

### 📋 タスク6.1: ワークフローファイル編集

**担当者:** 実作業者

**作業場所:** ローカル開発環境（VS Code）

**詳細手順:**

1. **ブランチを作成**
   - ターミナルを開く
   - プロジェクトルートに移動: `cd /Users/keisukewatanabe/Develop/thebotch/shift-scheduler-ai`
   - 新しいブランチを作成:
     ```bash
     git checkout -b feature/enable-sharepoint-backup
     ```

2. **ワークフローファイルを開く**
   - VS Codeでファイルを開く
   - ファイルパス: `.github/workflows/db-backup-to-sharepoint.yml`
   - 左サイドバー → `.github` → `workflows` → `db-backup-to-sharepoint.yml`

3. **現在の状態を確認**
   - ファイル全体がコメントアウトされている
   - 各行の先頭に `# ` が付いている

4. **コメントアウトを解除**

   **方法1: VS Codeの一括コメント解除機能**
   - `Ctrl+A`（Mac: `Cmd+A`）で全選択
   - `Ctrl+/`（Mac: `Cmd+/`）でコメント解除
   - ファイルの先頭行（`name: DB Backup to SharePoint`）から最終行まで全て選択されていることを確認

   **方法2: 手動で削除**
   - 各行の先頭にある `# ` を手動で削除
   - ⚠️ YAMLのインデント（スペース）を崩さないように注意

5. **ファイル内容の確認**
   - コメントが全て解除されていることを確認
   - 特に以下の部分が正しく解除されているか確認:
     ```yaml
     name: DB Backup to SharePoint

     on:
       schedule:
         - cron: '0 18 1,15 * *'  # 毎月1日・15日 3:00 JST (18:00 UTC前日)
       workflow_dispatch:  # 手動実行を許可

     jobs:
       backup:
         runs-on: ubuntu-latest
     ```

6. **インデントの確認**
   - YAMLファイルはインデント（空白）が重要
   - 各行のインデントが崩れていないことを確認
   - エラーがある場合、VS Codeが赤い波線で表示する

7. **ファイルを保存**
   - `Ctrl+S`（Mac: `Cmd+S`）で保存
   - ファイルタブの「●」（未保存マーク）が消えることを確認

**確認ポイント:**
- [ ] ファイル全体のコメントアウト（`# `）が解除されている
- [ ] YAMLのインデントが崩れていない
- [ ] `on:`, `jobs:`, `steps:` などのキーワードが正しく表示されている
- [ ] ファイルが保存されている

**アウトプット:**
- ✅ ワークフローファイルのコメントアウト解除完了

---

### 📋 タスク6.2: コミット・プッシュ

**担当者:** 実作業者

**作業場所:** ターミナル

**詳細手順:**

1. **変更内容を確認**
   ```bash
   git status
   ```
   - 出力: `.github/workflows/db-backup-to-sharepoint.yml` が変更されていることを確認

2. **差分を確認（オプション）**
   ```bash
   git diff .github/workflows/db-backup-to-sharepoint.yml
   ```
   - 各行の先頭から `# ` が削除されていることを確認
   - 緑色の `+` で表示される（コメント解除された行）

3. **変更をステージング**
   ```bash
   git add .github/workflows/db-backup-to-sharepoint.yml
   ```

4. **コミット**
   ```bash
   git commit -m "feat: SharePoint自動バックアップワークフローを有効化"
   ```
   - コミットメッセージは上記の通り正確に入力

5. **リモートにプッシュ**
   ```bash
   git push origin feature/enable-sharepoint-backup
   ```
   - 出力例:
     ```
     Enumerating objects: 7, done.
     ...
     To github.com:The-botch/shift-scheduler-ai.git
      * [new branch]      feature/enable-sharepoint-backup -> feature/enable-sharepoint-backup
     ```

6. **プルリクエストを作成**
   - GitHubリポジトリをブラウザで開く
   - 画面上部に「Compare & pull request」ボタンが表示される → クリック
   - または出力されたURLをブラウザで開く
   - PRタイトル: `feat: SharePoint自動バックアップワークフローを有効化`
   - PR説明:
     ```markdown
     ## 概要
     Phase 2のSharePoint自動バックアップを有効化します。

     ## 変更内容
     - `.github/workflows/db-backup-to-sharepoint.yml` のコメントアウトを解除

     ## 前提条件
     - ✅ GitHub Secretsに6つの環境変数を設定済み
     - ✅ Azure ADアプリ登録完了
     - ✅ SharePointフォルダ作成完了

     ## 関連WBS
     - タスク6.1, 6.2
     ```
   - 「Create pull request」ボタンをクリック

7. **PRをマージ**
   - レビューが完了したら（または不要な場合）
   - 「Merge pull request」ボタンをクリック
   - 「Confirm merge」をクリック
   - マージ完了後、ブランチを削除: 「Delete branch」をクリック

8. **mainブランチに切り替え**
   ```bash
   git checkout main
   git pull origin main
   ```

**確認ポイント:**
- [ ] コミットが成功している
- [ ] プッシュが成功している
- [ ] PRが作成されている
- [ ] PRがmainブランチにマージされている

**アウトプット:**
- ✅ ワークフローファイルがmainブランチにマージ完了
- ✅ GitHub Actionsでワークフローが有効化された

---

## 7. 動作確認

| タスクID | タスク名 | 担当者 | 作業内容 | 依存関係 | 状態 |
|---------|---------|--------|---------|---------|------|
| 7.1 | 手動トリガーでテスト実行 | **実作業者** | GitHub Actionsで手動実行 | 6.2完了後 | ⬜️ |
| 7.2 | ワークフロー実行ログ確認 | **実作業者** | 各ステップが成功していることを確認 | 7.1完了後 | ⬜️ |
| 7.3 | SharePointファイル確認 | **実作業者 + SharePoint管理者** | SharePointにdmpファイルがアップロードされているか確認 | 7.2完了後 | ⬜️ |
| 7.4 | バックアップファイル復元テスト | **実作業者** | pg_restoreでテストDBに復元 | 7.3完了後 | ⬜️ |

---

### 📋 タスク7.1: 手動トリガーでテスト実行

**担当者:** 実作業者

**作業場所:** GitHub Actions

**詳細手順:**

1. **GitHubリポジトリを開く**
   - ブラウザで https://github.com/The-botch/shift-scheduler-ai を開く

2. **Actionsタブを開く**
   - リポジトリ画面上部のタブから「Actions」をクリック

3. **ワークフローを選択**
   - 左サイドバーの「Workflows」リストから「DB Backup to SharePoint」を探してクリック
   - 画面中央にワークフローの実行履歴が表示される（まだ空）

4. **手動実行を開始**
   - 画面右上の「Run workflow」ボタン（青色）をクリック
   - ドロップダウンメニューが表示される
   - 「Branch: main」が選択されていることを確認
   - もう一度「Run workflow」ボタン（緑色）をクリック

5. **実行開始の確認**
   - ページが自動的に更新される
   - 実行履歴に新しいワークフローが表示される
   - タイトル: 「DB Backup to SharePoint」
   - ステータス: 🟡 黄色の回転アイコン（実行中）
   - 実行時間: 「a few seconds ago」

6. **実行の進行を監視**
   - ワークフローをクリックして詳細画面を開く
   - 「backup」ジョブが表示される
   - ステータスが「In progress」になっている

**確認ポイント:**
- [ ] 「Run workflow」ボタンをクリックできた
- [ ] ワークフローが実行開始された
- [ ] 実行履歴に表示されている

**推定実行時間:** 5-10分

**アウトプット:**
- ✅ GitHub Actionsで手動実行開始

---

### 📋 タスク7.2: ワークフロー実行ログ確認

**担当者:** 実作業者

**作業場所:** GitHub Actions詳細画面

**詳細手順:**

1. **ワークフロー詳細画面を開く**
   - タスク7.1の続き
   - または: Actions → DB Backup to SharePoint → 最新の実行をクリック

2. **backupジョブを開く**
   - 左サイドバーまたは画面中央の「backup」をクリック
   - 各ステップの一覧が表示される

3. **各ステップの成功を確認**
   - 以下のステップが全て緑色のチェックマーク✅になっていることを確認:

   **a. Set up job**
   - Ubuntu環境のセットアップ
   - 所要時間: 数秒

   **b. Checkout code**
   - リポジトリのコードをチェックアウト
   - 所要時間: 数秒

   **c. Install PostgreSQL client**
   - pg_dumpツールをインストール
   - クリックして展開 → 出力ログに `postgresql-client is already the newest version` などと表示される
   - 所要時間: 10-20秒

   **d. Create backup directory**
   - バックアップ用ディレクトリ作成
   - 所要時間: 1秒

   **e. Backup database schemas**
   - 4つのスキーマをバックアップ
   - ⚠️ このステップが最も重要
   - クリックして展開 → 出力ログを確認:
     ```
     💾 スキーマ「core」をバックアップ中...
     ✅ core: 0.05 MB
     💾 スキーマ「hr」をバックアップ中...
     ✅ hr: 0.12 MB
     💾 スキーマ「ops」をバックアップ中...
     ✅ ops: 0.08 MB
     💾 スキーマ「analytics」をバックアップ中...
     ✅ analytics: 0.02 MB
     ```
   - 所要時間: 1-3分

   **f. Compress backups**
   - dmpファイルを圧縮（.tar.gz）
   - 出力ログ: `backups.tar.gz` のファイルサイズが表示される
   - 所要時間: 5-10秒

   **g. Upload to SharePoint**
   - SharePointにアップロード
   - ⚠️ このステップも重要
   - クリックして展開 → 出力ログを確認:
     ```
     🔑 Azure ADアクセストークンを取得中...
     ✅ アクセストークン取得成功
     🔍 SharePointサイトIDを取得中...
     ✅ サイトID取得成功
     📤 SharePointにアップロード中...
     📂 ファイル名: backups-YYYY-MM-DD-HHMMSS.tar.gz
     📊 ファイルサイズ: X.XX MB
     ✅ アップロード成功
     ```
   - 所要時間: 30秒-2分

   **h. Post Checkout code**
   - クリーンアップ処理
   - 所要時間: 数秒

4. **全体の成功を確認**
   - 画面上部のステータスが緑色のチェックマーク✅「Success」になっている
   - 所要時間の合計: 5-10分

5. **エラーがある場合**
   - ステップに赤い❌が表示されている場合
   - そのステップをクリックして展開
   - エラーメッセージを確認
   - 後述のトラブルシューティングセクションを参照

**確認ポイント:**
- [ ] 全てのステップが緑色のチェックマーク✅
- [ ] 「Backup database schemas」で4スキーマがバックアップされている
- [ ] 「Upload to SharePoint」が成功している
- [ ] 全体のステータスが「Success」

**アウトプット:**
- ✅ GitHub Actionsワークフローが全て成功

---

### 📋 タスク7.3: SharePointファイル確認

**担当者:** 実作業者 + SharePoint管理者

**作業場所:** SharePoint

**詳細手順:**

1. **SharePointサイトを開く**
   - ブラウザでSharePointサイトURLにアクセス
   - タスク2.1で確認したURL
   - 例: `https://yourcompany.sharepoint.com/sites/IT-Team`

2. **DB-Backupsフォルダを開く**
   - 左メニュー → 「ドキュメント」または「Documents」
   - `DB-Backups` フォルダをクリック

3. **アップロードされたファイルを確認**
   - ファイル名: `backups-YYYY-MM-DD-HHMMSS.tar.gz`
   - 例: `backups-2026-01-06-181500.tar.gz`
   - ファイルサイズ: 約0.2-0.5 MB（圧縮後）
   - アップロード日時: タスク7.1の実行時刻

4. **ファイル詳細の確認**
   - ファイルを右クリック → 「詳細」
   - または: ファイルをクリック → 右パネルに詳細が表示される
   - 以下を確認:
     - ファイル名が正しい
     - サイズが妥当（0バイトでない）
     - アップロード日時が最近

5. **ファイルをダウンロード（次のタスク用）**
   - ファイルを選択
   - 上部メニュー → 「ダウンロード」ボタンをクリック
   - ローカルの `Downloads` フォルダに保存される

**確認ポイント:**
- [ ] DB-Backupsフォルダが存在する
- [ ] tar.gzファイルがアップロードされている
- [ ] ファイルサイズが0バイトでない
- [ ] ダウンロードできる

**アウトプット:**
- ✅ SharePointにバックアップファイルが正常にアップロードされている
- ✅ ファイルをローカルにダウンロード済み

---

### 📋 タスク7.4: バックアップファイル復元テスト

**担当者:** 実作業者

**作業場所:** ローカル開発環境（ターミナル）

**詳細手順:**

1. **ダウンロードしたファイルを解凍**
   ```bash
   cd ~/Downloads
   tar -xzf backups-2026-01-06-181500.tar.gz
   ls -lh
   ```
   - 出力: `core.dmp`, `hr.dmp`, `ops.dmp`, `analytics.dmp` の4ファイルが展開される
   - 各ファイルのサイズを確認（0バイトでないこと）

2. **テスト用データベースを作成**
   ```bash
   psql -d postgres -c "DROP DATABASE IF EXISTS test_restore;"
   psql -d postgres -c "CREATE DATABASE test_restore;"
   ```
   - 既存のtest_restoreがあれば削除して再作成

3. **スキーマを作成**
   ```bash
   psql -d test_restore -c "CREATE SCHEMA IF NOT EXISTS core;"
   psql -d test_restore -c "CREATE SCHEMA IF NOT EXISTS hr;"
   psql -d test_restore -c "CREATE SCHEMA IF NOT EXISTS ops;"
   psql -d test_restore -c "CREATE SCHEMA IF NOT EXISTS analytics;"
   ```

4. **バックアップを復元**
   ```bash
   pg_restore -d test_restore -n core core.dmp
   pg_restore -d test_restore -n hr hr.dmp
   pg_restore -d test_restore -n ops ops.dmp
   pg_restore -d test_restore -n analytics analytics.dmp
   ```
   - 各コマンドの実行結果を確認
   - エラーが出ていないことを確認（警告は許容）

5. **復元データの確認**
   ```bash
   # coreスキーマのテナント数を確認
   psql -d test_restore -c "SELECT COUNT(*) FROM core.tenants;"

   # hrスキーマのスタッフ数を確認
   psql -d test_restore -c "SELECT COUNT(*) FROM hr.staff;"

   # opsスキーマのシフト数を確認
   psql -d test_restore -c "SELECT COUNT(*) FROM ops.shifts;"

   # analyticsスキーマのテーブル確認
   psql -d test_restore -c "SELECT COUNT(*) FROM analytics.sales_actual;"
   ```
   - 各コマンドで0以上の数値が返されることを確認
   - エラーが出ないことを確認

6. **テストDBのクリーンアップ**
   ```bash
   psql -d postgres -c "DROP DATABASE test_restore;"
   rm core.dmp hr.dmp ops.dmp analytics.dmp
   rm backups-*.tar.gz
   ```

**確認ポイント:**
- [ ] tar.gzファイルが正常に解凍できた
- [ ] 4つの.dmpファイルが存在する
- [ ] pg_restoreがエラーなく完了した
- [ ] 各スキーマのテーブルにデータが存在する
- [ ] テストDBを削除した

**アウトプット:**
- ✅ バックアップファイルが正常に復元可能であることを確認

---

## 8. スケジュール実行確認

| タスクID | タスク名 | 担当者 | 作業内容 | 依存関係 | 状態 |
|---------|---------|--------|---------|---------|------|
| 8.1 | 次回自動実行日の確認 | **実作業者** | 毎月1日・15日 3:00 JSTの次回実行日を確認 | 7.4完了後 | ⬜️ |
| 8.2 | 自動実行結果確認 | **実作業者** | 自動実行後、GitHub ActionsとSharePointを確認 | 8.1完了後 | ⬜️ |

---

### 📋 タスク8.1: 次回自動実行日の確認

**担当者:** 実作業者

**作業場所:** カレンダーアプリ、リマインダー

**詳細手順:**

1. **スケジュールの確認**
   - ワークフローは以下のスケジュールで自動実行される:
     - 毎月1日 3:00 JST（前日 18:00 UTC）
     - 毎月15日 3:00 JST（前日 18:00 UTC）

2. **次回実行日の計算**
   - 現在の日付を確認
   - 今日が1日より前 → 次回は今月1日
   - 今日が1日〜14日 → 次回は今月15日
   - 今日が15日以降 → 次回は来月1日

3. **リマインダー設定**
   - カレンダーアプリに予定を追加:
     - タイトル: 「DBバックアップ自動実行の確認」
     - 日時: 次回実行日の 10:00（実行完了後）
     - 繰り返し: 毎月1日・15日
   - または: 実行日の朝にSlackリマインダーを設定

4. **確認手順をメモ**
   - 次のタスク8.2の手順をブックマーク

**確認ポイント:**
- [ ] 次回実行日を把握している
- [ ] リマインダーを設定した
- [ ] 確認手順をメモした

**アウトプット:**
- ✅ 次回自動実行日: ____年____月____日 3:00 JST
- ✅ カレンダーにリマインダー設定完了

---

### 📋 タスク8.2: 自動実行結果確認

**担当者:** 実作業者

**作業場所:** GitHub Actions、SharePoint

**詳細手順:**

1. **実行日の朝に確認**
   - 実行日: 毎月1日・15日の朝10時以降
   - 実行時刻: 深夜3:00（実行完了は3:10頃）

2. **GitHub Actionsで実行履歴を確認**
   - GitHub → Actions → 「DB Backup to SharePoint」
   - 最新の実行を確認
   - トリガー: 「schedule」と表示されている
   - ステータス: ✅ 緑のチェックマーク「Success」
   - 実行時刻: 前日 18:00 UTC頃（日本時間 深夜3:00頃）

3. **詳細ログの確認（オプション）**
   - 実行をクリック → backupジョブを開く
   - 「Backup database schemas」ステップで4スキーマがバックアップされているか確認
   - 「Upload to SharePoint」ステップで成功しているか確認

4. **SharePointでファイルを確認**
   - SharePoint → Shared Documents → DB-Backups
   - 新しいtar.gzファイルが追加されているか確認
   - ファイル名に今日の日付（または前日深夜の日付）が含まれているか確認

5. **ファイル数の確認**
   - DB-Backupsフォルダ内のファイル数を確認
   - 月2回実行 × 6ヶ月保存 = 約12ファイル
   - 古いファイル（6ヶ月以上前）は手動で削除（オプション）

6. **問題がある場合**
   - エラーがあれば後述のトラブルシューティングを参照
   - GitHub Issueを作成してログを記録

**確認項目チェックリスト:**

| 項目 | 確認内容 | 状態 |
|-----|---------|------|
| GitHub Actions | ワークフローが成功している | ⬜️ |
| GitHub Actions | トリガーが「schedule」である | ⬜️ |
| GitHub Actions | 4スキーマがバックアップされている | ⬜️ |
| SharePoint | 新しいtar.gzファイルが存在する | ⬜️ |
| SharePoint | ファイルサイズが妥当（0.2-0.5MB） | ⬜️ |
| SharePoint | ファイル名に今日の日付が含まれる | ⬜️ |

**アウトプット:**
- ✅ 自動実行が成功したことを確認
- ✅ SharePointにファイルがアップロードされた

---

## 9. Phase 1クリーンアップ

| タスクID | タスク名 | 担当者 | 作業内容 | 依存関係 | 状態 |
|---------|---------|--------|---------|---------|------|
| 9.1 | Phase 1スクリプト削除 | **実作業者** | `scripts/backup/backup-db.mjs` を削除 | 8.2完了後 | ⬜️ |
| 9.2 | package.json修正 | **実作業者** | `bk:prod` コマンドを削除 | 9.1完了後 | ⬜️ |
| 9.3 | README更新 | **実作業者** | Phase 1セクションを削除 | 9.2完了後 | ⬜️ |
| 9.4 | 変更のコミット | **実作業者** | Phase 1削除をコミット・プッシュ | 9.3完了後 | ⬜️ |

---

### 📋 タスク9.1: Phase 1スクリプト削除

**担当者:** 実作業者

**作業場所:** ローカル開発環境

**詳細手順:**

1. **ブランチ作成**
   ```bash
   cd /Users/keisukewatanabe/Develop/thebotch/shift-scheduler-ai
   git checkout main
   git pull origin main
   git checkout -b chore/remove-phase1-backup
   ```

2. **Phase 1スクリプトを削除**
   ```bash
   rm scripts/backup/backup-db.mjs
   ```

3. **削除を確認**
   ```bash
   git status
   ```
   - 出力: `deleted: scripts/backup/backup-db.mjs` が表示される

**アウトプット:**
- ✅ `scripts/backup/backup-db.mjs` 削除完了

---

### 📋 タスク9.2: package.json修正

**担当者:** 実作業者

**作業場所:** VS Code

**詳細手順:**

1. **package.jsonを開く**
   - VS Codeでファイルを開く
   - ファイルパス: `package.json`（プロジェクトルート）

2. **bk:prodコマンドを削除**
   - 「scripts」セクションを探す
   - 以下の行を見つける:
     ```json
     "bk:prod": "node scripts/backup/backup-db.mjs",
       "_comment": "localでproduction環境のdmpを取得する。暫定対応用なので後で正式な方法に切り替える。使い方は'shift-scheduler-ai/scripts/backup/README.md'参照",
     ```
   - この2行を削除

3. **カンマの確認**
   - 削除後、前の行の末尾にカンマ`,`があるか確認
   - 最後の項目にはカンマが不要

4. **ファイルを保存**
   - `Ctrl+S`（Mac: `Cmd+S`）

5. **JSON構文エラーの確認**
   ```bash
   npm run --silent test:db 2>&1 | head -1
   ```
   - エラーが出ないことを確認（package.jsonの構文が正しい）

**確認ポイント:**
- [ ] `bk:prod` 行が削除されている
- [ ] `_comment` 行も削除されている
- [ ] JSON構文エラーがない

**アウトプット:**
- ✅ package.json から `bk:prod` コマンド削除完了

---

### 📋 タスク9.3: README更新

**担当者:** 実作業者

**作業場所:** VS Code

**詳細手順:**

1. **READMEを開く**
   - VS Codeでファイルを開く
   - ファイルパス: `scripts/backup/README.md`

2. **Phase 1セクションを削除**
   - ファイル内で「Phase 1」を検索（`Ctrl+F` / `Cmd+F`）
   - 以下のセクションを削除:
     - 「Phase 1: ローカル手動実行」の見出しから
     - Phase 1に関する全ての記述
     - 「環境変数の設定」セクション（Phase 1用）
     - 「実行方法」セクション（`npm run bk:prod` の説明）
     - 「復元方法」セクション（ローカル復元の説明）

3. **Phase 2セクションを更新**
   - 「Phase 2」という見出しを削除
   - Phase 2の内容を前に移動（メインセクションとして）
   - 「Phase 2が正式版になりました」という注釈を追加

4. **ファイルを保存**
   - `Ctrl+S`（Mac: `Cmd+S`）

**確認ポイント:**
- [ ] Phase 1に関する記述が全て削除されている
- [ ] Phase 2の内容がメインセクションになっている
- [ ] ファイルが保存されている

**アウトプット:**
- ✅ README.md からPhase 1セクション削除完了

---

### 📋 タスク9.4: 変更のコミット

**担当者:** 実作業者

**作業場所:** ターミナル

**詳細手順:**

1. **変更内容を確認**
   ```bash
   git status
   ```
   - 出力:
     - `deleted: scripts/backup/backup-db.mjs`
     - `modified: package.json`
     - `modified: scripts/backup/README.md`

2. **変更をステージング**
   ```bash
   git add -A
   ```

3. **コミット**
   ```bash
   git commit -m "chore: Phase 1バックアップスクリプトを削除（SharePoint自動化完了のため）"
   ```

4. **プッシュ**
   ```bash
   git push origin chore/remove-phase1-backup
   ```

5. **PRを作成**
   - GitHubで自動的に表示される「Compare & pull request」をクリック
   - PRタイトル: `chore: Phase 1バックアップスクリプトを削除`
   - PR説明:
     ```markdown
     ## 概要
     Phase 2のSharePoint自動バックアップが正常稼働したため、Phase 1の手動実行スクリプトを削除します。

     ## 変更内容
     - `scripts/backup/backup-db.mjs` を削除
     - `package.json` から `bk:prod` コマンドを削除
     - `scripts/backup/README.md` からPhase 1セクションを削除

     ## 関連WBS
     - タスク9.1, 9.2, 9.3, 9.4
     ```
   - 「Create pull request」をクリック

6. **PRをマージ**
   - レビュー後（または即座に）「Merge pull request」をクリック
   - ブランチを削除

7. **mainに切り替え**
   ```bash
   git checkout main
   git pull origin main
   ```

**確認ポイント:**
- [ ] コミットが成功している
- [ ] PRがマージされている
- [ ] Phase 1ファイルがリポジトリから削除されている

**アウトプット:**
- ✅ Phase 1クリーンアップ完了
- ✅ Phase 2が正式版になった

---

## トラブルシューティング

### よくあるエラーと対処法

#### 1. Azure AD認証エラー

**エラーメッセージ:**
```
❌ アクセストークン取得エラー: 認証エラー: 401 Unauthorized
```

**原因と対処:**
- [ ] GitHub Secretsの `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` が正しいか確認
- [ ] Azure AD管理者が「管理者の同意」をクリックしたか確認（タスク3.5）
- [ ] Client Secretの有効期限が切れていないか確認

**確認方法:**
- Azure Portal → Azure AD → App registrations → DB-Backup-Uploader
- API permissions → Sites.ReadWrite.All に緑のチェックマークがあるか確認

---

#### 2. SharePointアクセスエラー

**エラーメッセージ:**
```
❌ サイトID取得エラー: 404 Not Found
```

**原因と対処:**
- [ ] GitHub Secretsの `SHAREPOINT_SITE_URL` が正しいか確認
- [ ] URLの末尾にスラッシュ `/` がないか確認（あれば削除）
- [ ] SharePointサイトが存在するか、ブラウザで開いて確認

---

#### 3. フォルダが見つからないエラー

**エラーメッセージ:**
```
❌ アップロードエラー: 404 itemNotFound
```

**原因と対処:**
- [ ] GitHub Secretsの `SHAREPOINT_FOLDER_PATH` が正しいか確認
- [ ] 値が `Shared Documents/DB-Backups` であることを確認（スペース・ハイフンの位置）
- [ ] SharePointでフォルダが実際に存在するか確認

---

#### 4. データベース接続エラー

**エラーメッセージ:**
```
❌ pg_dump: error: connection to server failed
```

**原因と対処:**
- [ ] GitHub Secretsの `DATABASE_URL_PRODUCTION` が正しいか確認
- [ ] RailwayでDBが稼働しているか確認
- [ ] ネットワークの問題（GitHub ActionsからRailwayへの接続）

---

#### 5. Client Secret有効期限切れ

**エラーメッセージ:**
```
❌ アクセストークン取得エラー: invalid_client
```

**原因:**
- Client Secretの有効期限（24ヶ月）が切れた

**対処:**
1. Azure AD管理者に依頼して新しいClient Secretを作成（タスク3.6と同じ手順）
2. GitHub Secretsの `AZURE_CLIENT_SECRET` を更新
3. 手動実行でテスト

---

### サポート連絡先

**問題が解決しない場合:**
1. GitHub Actionsの実行ログをスクリーンショット
2. エラーメッセージを記録
3. 以下に問い合わせ:
   - システム管理部門: [連絡先]
   - Azure AD管理者: [連絡先]
   - SharePoint管理者: [連絡先]

---

## 完了チェックリスト

### 全タスク完了確認

- [ ] 1.1: SharePoint利用承認取得
- [ ] 1.2: Azure AD管理者の特定
- [ ] 2.1: SharePointサイト確認
- [ ] 2.2: バックアップフォルダ作成
- [ ] 2.3: フォルダ権限設定確認
- [ ] 3.1: Azure Portalへログイン
- [ ] 3.2: テナントID確認
- [ ] 3.3: アプリケーション登録
- [ ] 3.4: アプリケーションID取得
- [ ] 3.5: API権限付与
- [ ] 3.6: クライアントシークレット作成
- [ ] 3.7: 認証情報の引き渡し
- [ ] 4.1: 本番DB接続情報取得
- [ ] 4.2: 接続情報の引き渡し
- [ ] 5.1: GitHub Secretsに移動
- [ ] 5.2: AZURE_TENANT_ID設定
- [ ] 5.3: AZURE_CLIENT_ID設定
- [ ] 5.4: AZURE_CLIENT_SECRET設定
- [ ] 5.5: SHAREPOINT_SITE_URL設定
- [ ] 5.6: SHAREPOINT_FOLDER_PATH設定
- [ ] 5.7: DATABASE_URL_PRODUCTION設定
- [ ] 6.1: ワークフローファイル編集
- [ ] 6.2: コミット・プッシュ
- [ ] 7.1: 手動トリガーでテスト実行
- [ ] 7.2: ワークフロー実行ログ確認
- [ ] 7.3: SharePointファイル確認
- [ ] 7.4: バックアップファイル復元テスト
- [ ] 8.1: 次回自動実行日の確認
- [ ] 8.2: 自動実行結果確認
- [ ] 9.1: Phase 1スクリプト削除
- [ ] 9.2: package.json修正
- [ ] 9.3: README更新
- [ ] 9.4: 変更のコミット

### 最終確認

- [ ] GitHub Actionsで自動実行が成功している
- [ ] SharePointにバックアップファイルが保存されている
- [ ] バックアップファイルが復元可能である
- [ ] Phase 1スクリプトが削除されている
- [ ] 次回自動実行のリマインダーが設定されている

---

## プロジェクト完了

**おめでとうございます！Phase 2のSharePoint自動バックアップ実装が完了しました。**

**今後の運用:**
- 毎月1日・15日にGitHub Actionsが自動実行
- 実行結果を確認（タスク8.2の手順）
- 6ヶ月経過したバックアップファイルを手動削除（オプション）
- Client Secretの有効期限（2年後）が近づいたら更新

**完了日:** ____年____月____日
