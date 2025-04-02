# headline-checker

見出しと内容を比較して適切な見出しに変化させる拡張機能

python 3.13.2
node 22.14.0
chrome://extensions/

## 使い方

1. **拡張機能をインストールする**

   - このリポジトリをクローンし、必要な依存関係をインストールします。
     ```bash
     npm install
     ```
   - [manifest.json](http://_vscodecontentref_/0) を含むディレクトリを Chrome の拡張機能ページ（`chrome://extensions/`）で「パッケージ化されていない拡張機能を読み込む」から読み込みます。

2. **バックエンドサーバーを起動する**

   - Python 3.13.2 をインストールし、必要なライブラリをインストールします。
     ```bash
     pip install -r requirements.txt
     ```
   - [app.py](http://_vscodecontentref_/1) を実行してバックエンドサーバーを起動します。
     ```bash
     python app.py
     ```

3. **ニュースサイトで拡張機能を使用する**

   - 対象のニュースサイト（例: `https://www.goo.ne.jp/`）にアクセスします。
   - 記事の見出しにカーソルを合わせると、ツールチップが表示されます。
   - ツールチップのボタンをクリックすると、AI が記事内容を解析し、適切な見出しを提案します。

4. **開発モードでの変更を反映する**

   - [content_src.js](http://_vscodecontentref_/2) を編集した場合、以下のコマンドでビルドを実行します。
     ```bash
     npm run build
     ```
   - 開発中は以下のコマンドで変更を監視し、自動ビルドを有効にできます。
     ```bash
     npm run watch
     ```

5. **注意事項**
   - バックエンドサーバーはローカル環境で動作します。[app.py](http://_vscodecontentref_/3) を停止すると拡張機能は動作しません。
   - 対象のニュースサイトは [manifest.json](http://_vscodecontentref_/4) の `host_permissions` に記載された URL に限定されます。
