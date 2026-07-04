# CaddyPro v3 開発指示書

Claude Codeへ：この指示書を元に完全新規でindex.htmlを作成してください

## 基本情報

* ファイル形式：単一HTMLファイル（index.html）
* 言語：HTML + CSS + JavaScript（バニラJS）
* データベース：Firebase Realtime Database
* 認証：Firebase Authentication
* ホスティング：GitHub Pages（winwincaddy/caddypro）
* Firebase設定：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDFWQLDjXqYaJ7QbtZlcsmNR3TywV6HGlU",
  authDomain: "caddypro-c3a44.firebaseapp.com",
  databaseURL: "https://caddypro-c3a44-default-rtdb.firebaseio.com",
  projectId: "caddypro-c3a44",
  storageBucket: "caddypro-c3a44.firebasestorage.app",
  messagingSenderId: "956784211640",
  appId: "1:956784211640:web:c1427c3a1ad273d4d9e64d",
  measurementId: "G-G3XPXY8BRQ"
};
```

## デザイン仕様

### カラーパレット

```css
:root {
  --gd: #0f2318;      /* 最暗グリーン（背景） */
  --gm: #1a3a2a;      /* 中グリーン（ヘッダー・カード） */
  --gl: #2d5a3d;      /* 明るいグリーン */
  --gold: #c9a84c;    /* ゴールド */
  --goldl: #e8c96a;   /* 明るいゴールド */
  --cream: #f0e8d0;   /* クリーム（メインテキスト） */
  --gray: #8a9e8a;    /* グレー（サブテキスト） */
  --red: #c03a2b;     /* レッド（削除・エラー） */
  --green: #4a8c5c;   /* グリーン（成功） */
}
```

### フォント

* メイン：Noto Sans JP（300/400/500/700/900）
* 数字：DM Mono（400/500）
* Google Fontsから読み込み

### 共通UIルール

* 角丸：ボタン14-16px、カード15px、モーダル24px
* ボーダー：rgba(201,168,76,0.2) の薄いゴールド
* シャドウなし（グラデーションで立体感）
* アクティブ時：transform:scale(.97-.98)
* トランジション：all 0.2s

## Firebase構造

```
caddypro/
  employees/        従業員データ
  courses/          ゴルフ場データ
  attendance/       出勤記録
  shifts/           確定シフト
  notices/          翌日出勤連絡
  requests/         ゴルフ場からの出勤依頼
  sales/            売上データ
  rates/            単価マスター
  settings/         設定データ
  shiftRequests/    従業員シフト希望申請
```

### 従業員（employees）オブジェクト

```javascript
{
  id: String,           // タイムスタンプ
  name: String,         // 氏名
  pin: String,          // 4桁PINコード
  role: String,         // 役職（例：キャディー）
  contract: String,     // 契約種別（後述）
  email: String,        // メールアドレス
  phone: String,        // 電話番号
  address: String,      // 住所
  invoiceNo: String,    // インボイス登録番号
  companyName: String,  // 屋号
  bankName: String,     // 銀行名
  bankBranch: String,   // 支店名
  bankAccount: String,  // 口座番号
  bankHolder: String,   // 口座名義
  withholding: Boolean  // 源泉徴収あり/なし
}
```

### 契約種別（contract）

* `baito`：アルバイト → 税なし
* `invoice_yes`：業務委託（インボイス登録あり）→ 2割特例（÷1.08×1.1）
* `invoice_no`：業務委託（インボイス登録なし）→ 消費税10%（×1.1）
* `training`：研修 → 税なし・研修費7,000円会社負担

### ゴルフ場（courses）オブジェクト

```javascript
{
  id: String,
  name: String,           // ゴルフ場名
  address: String,        // 住所
  phone: String,          // 電話番号
  manager: String,        // 担当者名
  managerEmail: String,   // 担当者メール
  closingDay: String,     // 締め日（末日/20/25など）
  invoiceDay: Number,     // 請求書発行日（締め日の〇日後）
  paymentDue: String,     // 支払期限
  weekdayWeekend: Boolean,// 平日/土日祝 単価区別
  cafeteria: Boolean,     // 食堂あり/なし
  cafeteriaFee: Number,   // 食堂利用料（税込）
  cafeteriaBurden: String,// 負担区分（company/employee/individual）
  nomination: Boolean,    // 指名料あり/なし
  nominationFee: Number,  // 指名料（税別）
  extraItems: Array       // 追加項目 [{name, amount, type:'add'/'subtract'}]
}
```

### 単価マスター（rates）

```javascript
rates: {
  [empId]: {
    [courseId]: {
      contractWd: Number,  // 契約金（平日・税別）
      contractWe: Number,  // 契約金（土日祝・税別）
      wageWd: Number,      // 給料（平日）
      wageWe: Number,      // 給料（土日祝）
      // 平日/土日区別なしの場合
      contract: Number,    // 契約金（税別）
      wage: Number         // 給料
    }
  }
}
```

### 出勤記録（attendance）オブジェクト

```javascript
{
  id: String,
  empId: String,
  empName: String,
  courseId: String,
  courseName: String,
  date: String,        // YYYY-MM-DD
  punchTime: String,   // HH:MM
  rounds: Number,      // 0.5/1/1.5/2/2.5
  nominationCount: Number,  // 指名回数
  cafeteriaUsed: Boolean,   // 食堂利用
  status: String,      // pending/approved/rejected
  wage: Number,        // 給料（計算後）
  contractAmount: Number // 契約金（計算後）
}
```

### 翌日出勤連絡（notices）オブジェクト

```javascript
{
  id: String,
  empId: String,
  empName: String,
  courseId: String,
  courseName: String,
  date: String,         // YYYY-MM-DD（翌日の日付）
  startTime: String,    // 集合時間 HH:MM
  gameStartTime: String,// スタート時間 HH:MM
  memo: String,         // コメント
  confirmed: Boolean    // 従業員確認済み
}
```

### シフト希望申請（shiftRequests）オブジェクト

```javascript
{
  id: String,
  empId: String,
  empName: String,
  date: String,         // YYYY-MM-DD
  status: String        // pending/approved/rejected
}
```

### 確定シフト（shifts）オブジェクト

```javascript
{
  id: String,
  date: String,
  courseId: String,
  courseName: String,
  empId: String,        // または employees: [empId1, empId2]
  empName: String,
  startTime: String,    // 集合時間
  gameStartTime: String,// スタート時間
  memo: String
}
```

## Firebase接続の実装

```javascript
// type="module"スクリプトで実装
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue, set } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// 匿名認証でFirebase接続後にデータ読み込み開始
signInAnonymously(auth).then(() => {
  updateFbStatus(true);
  loadAllData();
}).catch(e => updateFbStatus(false));

// onValueでリアルタイム同期
// データはwindow._stateにキャッシュ
// 保存はwindow.saveToFirebase(path, data)で実行
```

### Firebase接続バナー（必須）

全画面の最上部に常時表示（position:sticky、top:0、z-index:999、height:28px）

* 接続中：`🟢 Firebase接続中（リアルタイム同期）` - 緑色テキスト・緑ボーダー
* 未接続：`🔴 オフラインモード` - 赤テキスト・赤ボーダー
* 背景：`rgba(10,40,20,0.98)` の暗いグリーン
* 各画面に個別のfb-bar divを配置（fbStatus1〜fbStatus4）
* updateFbStatus(ok)関数で全バナーを一括更新

## 画面構成

### 画面の種類

* `.screen`：メイン画面（position:fixed、z-index:100）
* `.subscreen`：サブ画面（position:fixed、z-index:200）
* `.modal`：モーダル（position:fixed、z-index:500）

### 画面一覧

1. `topScreen`：ログイン画面（デフォルト表示）
2. `pinScreen`：PIN入力画面
3. `empScreen`：従業員メニュー画面
4. `adminScreen`：管理者画面

### サブスクリーン一覧（従業員用）

* `punchSub`：出勤打刻
* `noticeSub`：翌日出勤確認
* `shiftApplySub`：シフト希望申請
* `shiftConfSub`：確定シフト確認
* `invoiceSub`：請求書作成
* `historySub`：出勤記録
* `myInfoSub`：個人情報管理

### 画面①：ログイン画面（topScreen）

```
[Firebase接続バナー]
[ロゴエリア]
  ⛳ CaddyPro
  CADDY DISPATCH SYSTEM
[ログインボタン]
  👤 従業員ログイン（PIN番号）  → pinScreenへ
  🔒 管理者ログイン（Google）  → Googleログイン → adminScreenへ
```

* 背景：linear-gradient(160deg, #071210, #1a3a2a, #0f2318)

### 画面②：PIN入力画面（pinScreen）

```
[Firebase接続バナー]
[PIN番号を入力]
[4つのドット（入力に応じて塗りつぶし）]
[エラーメッセージ欄]
[数字キーパッド 3×4]
  1 2 3
  4 5 6
  7 8 9
    0 ⌫
[← 戻る]（topScreenへ）
```

* PIN4桁入力後、自動的にcheckPin()を実行
* Firebaseデータの従業員と照合（window._fbEmps優先）
* 一致した場合：従業員名を表示してempScreenへ
* 不一致の場合：「PINが違います」エラー表示、2秒後に消去

### 画面③：従業員メニュー画面（empScreen）

```
[Firebase接続バナー]
[ヘッダー: 従業員名 | ログアウト]
[メニューグリッド 2列]
  [🕓 出勤打刻]（全幅） → punchSub
  [🔔 翌日出勤確認] ※未確認件数バッジ → noticeSub
  [📅 シフト希望申請]  → shiftApplySub
  [✅ 確定シフト確認]  → shiftConfSub
  [📄 請求書作成]     → invoiceSub
  [📋 出勤記録]       → historySub
  [👤 個人情報管理]（全幅） → myInfoSub
```

### サブ画面①：出勤打刻（punchSub）

```
[← 戻る] 🕓 出勤打刻
[本日の状況カード]
  - 未打刻：「まだ打刻していません」
  - 打刻済み：「⏳ 承認待ち」
[派遣先ゴルフ場（セレクト）]
  - Firebaseのcourses一覧から動的生成
  - data-cafe属性（食堂あり:1/なし:0）
  - data-nom属性（指名あり:1/なし:0）
[ラウンド数（セレクト）]
  - 0.5R / 1R / 1.5R / 2R / 2.5R
[指名回数（セレクト）]※指名ありのゴルフ場のみ表示
  - なし / 1回 / 2回 / 3回
[食堂利用チェックボックス]※食堂ありのゴルフ場のみ表示
[🕓 出勤するボタン]
```

doPunch()処理：

1. ゴルフ場未選択チェック
2. attendance/{id}にデータ保存（status:'pending'）
3. ボタンを「⏳ 承認待ち」に変更
4. 管理者ダッシュボードの承認待ちに表示される

給料自動計算ロジック：

```javascript
// 土日祝判定
const isWeekend = (date) => {
  const d = new Date(date);
  return d.getDay() === 0 || d.getDay() === 6; // 祝日は別途判定
};

// 単価取得
const rate = state.rates[empId]?.[courseId] || {};
const isWd = !isWeekend(date);
const contractAmount = isWd ? (rate.contractWd || rate.contract || 0) : (rate.contractWe || rate.contract || 0);
const wageBase = isWd ? (rate.wageWd || rate.wage || 0) : (rate.wageWe || rate.wage || 0);

// ラウンド数×単価
const contract = contractAmount * rounds;
const wageBeforeTax = wageBase * rounds;

// 契約種別による給料計算
let wage;
if (emp.contract === 'invoice_yes') {
  wage = Math.round(wageBeforeTax / 1.08 * 1.1); // 2割特例
} else if (emp.contract === 'invoice_no') {
  wage = Math.round(wageBeforeTax * 1.1); // 消費税10%
} else {
  wage = wageBeforeTax; // アルバイト・研修
}

// 指名料
const nominationBase = course.nominationFee || 0;
let nominationWage;
if (emp.contract === 'invoice_yes') {
  nominationWage = Math.round(nominationBase / 1.08 * 1.1 * nominationCount);
} else if (emp.contract === 'invoice_no') {
  nominationWage = Math.round(nominationBase * 1.1 * nominationCount);
} else {
  nominationWage = nominationBase * nominationCount;
}

// 食堂利用料（従業員負担の場合、給料から差し引き）
const cafeteria = cafeteriaUsed && course.cafeteriaFee ? course.cafeteriaFee : 0;
const cafeteriaBurden = course.cafeteriaBurden;
const cafeteriaDeduct = (cafeteriaBurden === 'employee') ? cafeteria : 0;

const totalWage = wage + nominationWage - cafeteriaDeduct;
```

### サブ画面②：翌日出勤確認（noticeSub）

```
[← 戻る] 🔔 翌日出勤確認
[notices一覧（自分の未来日のnotice）]
  未確認カード（赤ボーダー）：
    日付（曜日）
    ⛳ ゴルフ場名
    🕖 集合 HH:MM  🏌️ スタート HH:MM
    コメント
    [✅ 確認しましたボタン]
  確認済みカード（暗いボーダー）：
    同上 + ✅ 確認済み表示
```

confirmNoticeById(id)処理：

* notice.confirmed = true
* Firebase保存
* カードのUI更新
* バッジを非表示

### サブ画面③：シフト希望申請（shiftApplySub）

```
[← 戻る] 📅 シフト希望申請
[月カレンダーナビ ‹ 2026年〇月 ›]
[「日付をタップして希望を追加/削除」]
[月間カレンダー（7列グリッド）]
  - 希望済み日：緑背景・緑ドット
  - 日：赤、土：青紫テキスト
  - タップでtoggleDate()
[申請済み一覧]
  - 日付 + [⏳ 審査中 / ✅ 承認済み / ❌ 却下]バッジ
```

toggleDate(dateStr)処理：

* 既存申請があれば削除（shiftRequestsから除去）
* なければ新規追加（status:'pending'）
* Firebase保存
* カレンダー再描画

### サブ画面④：確定シフト確認（shiftConfSub）

```
[← 戻る] ✅ 確定シフト
[月選択セレクト（直近6ヶ月）]
[確定シフト一覧]
  - 日付（曜日）
  - ⛳ ゴルフ場名　集合 HH:MM
  - [確定]バッジ（緑）
```

renderShiftConfirmed()：

* window._stateのshiftsから自分のシフトを抽出
* 選択月でフィルタ
* 日付昇順で表示

### サブ画面⑤：請求書作成（invoiceSub）

```
[← 戻る] 📄 請求書作成
[対象月セレクト（直近6ヶ月）]
[集計カード]
  出勤日数 / ラウンド数 / 請求金額（税込） / 消費税
[🖨️ 請求書を印刷ボタン]
```

printInvoice()処理：

* 対象月の自分のattendanceを集計
* 業務委託：請求書フォーマット（インボイス番号記載）
* アルバイト：給与明細フォーマット
* 新しいウィンドウで印刷ダイアログ

業務委託請求書フォーマット（A4）：

```
請求書
  発行日：令和〇年〇月〇日
  登録番号：T〇〇〇（インボイス番号）
  住所：〇〇〇
  WIN STAR株式会社 御中

  合計金額 ¥〇〇〇 円（税込）

  [明細テーブル]
  日付 | 概要 | ラウンド数 | 単価(税込) | 指名料 | 食堂 | 金額(税込)

  合計ラウンド数：〇R
  小計（税込）：¥〇〇〇
  消費税10%：¥〇〇〇
  合計：¥〇〇〇

  振込先：銀行名 支店名 普通〇〇〇〇〇〇〇
  口座名義：〇〇〇
```

### サブ画面⑥：出勤記録（historySub）

```
[← 戻る] 📋 出勤記録
[月選択セレクト]
[出勤記録一覧]
  - 日付（曜日）
  - ⛳ ゴルフ場　〇R　¥〇〇〇
```

renderEmpHistory()：

* window._stateのattendanceから自分のstatus:'approved'を抽出
* 月フィルタ・日付降順

### サブ画面⑦：個人情報管理（myInfoSub）

```
[← 戻る] 👤 個人情報管理
[基本情報セクション]
  氏名 / 住所 / 電話番号 / メール
[雇用情報セクション]
  雇用形態（セレクト）/ インボイス番号 / 屋号
[振込先セクション]
  銀行名 / 支店名 / 口座番号 / 口座名義
[PINコード変更セクション]
  新しいPIN（4桁）
[保存するボタン]
```

保存処理：

* window._stateのemployeesから自分のデータを更新
* Firebase保存

### 画面④：管理者画面（adminScreen）

構成

```
[Firebase接続バナー（fbStatus4）]
[ヘッダー: ⛳ CaddyPro 管理者 | ログアウト] (sticky top:28px)
[タブバー] (sticky top:81px)
  ダッシュボード / シフト管理 / 勤怠管理 / 売上・請求 / 設定
[コンテンツエリア (max-width:600px)]
```

#### タブ①：ダッシュボード

```
[統計3列]
  本日出勤 | 承認待ち | 未確認連絡

[今日の出勤状況]（dashTodayList）
  - 今日承認済みのattendance一覧
  - 従業員名 / ゴルフ場 / 打刻時間 / [出勤中]バッジ
  - データなし：「本日の出勤はありません」

[承認待ち打刻]（dashPendingList）
  - status:'pending'のattendance一覧
  - 従業員名 / 日付・ゴルフ場・ラウンド数・時間
  - [承認]ボタン → approveAtt(id)
  - [却下]ボタン → rejectAtt(id)

[今月の売上]
  総売上 | 総ラウンド | 総給料 | 利益率
```

renderDashboard(state)：

* 今日の日付でフィルタ
* 当月salesを集計
* 統計カード・リストをすべてFirebaseデータで更新

approveAtt(id)：

* attendance.status = 'approved'
* Firebase保存
* ダッシュボード再描画

#### タブ②：シフト管理（sub-tabs）

カレンダー（shift-cal）

```
[月ナビ ‹ 2026年〇月 ›]
[月間カレンダー]
  - 依頼あり：薄いゴールド背景・件数表示
  - タップ → 日別割り振りパネルを表示

[日別割り振りパネル（shiftDayPanel）]
  [〇月〇日（曜）の割り振り]
  [ゴルフ場依頼一覧]
    - ゴルフ場名 / 必要人数
    - [割り振りボタン] → assignModalを開く
    - [断るボタン] → request.status = 'rejected'
  [出勤希望の従業員]
    - 希望ありの従業員チップ（🟢希望あり）
    - 他コース確定済み（★別ゴルフ場）
```

ゴルフ場依頼（shift-req）

```
[ゴルフ場からの依頼]  [+ 追加ボタン]
[PDFアップロードエリア（AI読み取り）]
[依頼一覧（reqList）]
  - ゴルフ場名・日付・人数
  - [⏳ 検討中 / ✅ 確定 / ❌ 断る]バッジ
```

従業員申請（shift-empreq）

```
[シフト希望申請一覧（empReqList）]
  - 従業員名・日付
  - [承認ボタン] → approveModalを開く（ゴルフ場割り振り）
  - [却下ボタン] → status:'rejected'
```

翌日連絡（shift-notify）

```
[翌日出勤連絡一覧（notifyList）]
  - 従業員名 / ゴルフ場・集合時間
  - [✅ 確認済み / 未確認]バッジ
[+ 翌日連絡を追加ボタン] → noticeModal
```

#### タブ③：勤怠管理（sub-tabs）

承認待ち（attend-pending）

```
[承認待ち打刻一覧]
  - 従業員名 / 日付・ゴルフ場・ラウンド数・打刻時間
  - [承認][却下]ボタン
```

手動打刻（attend-manual）

```
[従業員セレクト]
[日付入力]
[ゴルフ場セレクト]
[ラウンド数セレクト: 0.5R/1R/1.5R/2R/2.5R]
[指名回数セレクト: 0/1/2/3]
[食堂利用チェック]
[打刻を登録ボタン] → attendance保存（status:'approved'）
```

勤怠一覧（attend-list）

```
[月選択セレクト]
[出勤記録テーブル（attListTable）]
  日付 | 氏名 | ゴルフ場 | R数 | 給料
  ※直近30件
```

#### タブ④：売上・請求（sub-tabs）

売上（sales-summary）

```
[月選択セレクト]
[集計カード 2×2]
  総売上 | 総ラウンド | 総給料 | 利益率

[ゴルフ場別売上（salesByCourse）]
  テーブル：ゴルフ場 | 売上 | R数

[従業員別売上（salesByEmp）]
  テーブル：氏名 | 売上 | 給料 | 利益率
```

利益率計算：

```javascript
profit = Math.round((totalSales - totalWage) / totalSales * 100)
```

ゴルフ場請求書（sales-invoice）

```
[ゴルフ場セレクト]
[対象月セレクト]
[請求書プレビューカード]
  ゴルフ場名 御中
  〇月分 キャディー派遣
  [明細行]
  食堂利用料（△マイナス）
  小計 / 消費税10% / 合計
[🖨️ 印刷ボタン]
[📧 メールで送付ボタン]
```

請求書フォーマット（2種類）：

* 全員同じ単価 → 日付別明細型（千葉バーディ型）
* 従業員ごとに単価が違う → 単価別まとめ型（グリーントラスト型）

ゴルフ場請求書計算：

```
契約金(税別) × ラウンド数 = キャディ業務
指名料(税別) × 指名回数 = 指名料
食堂利用料 = △（マイナス表示）
小計 = キャディ業務 + 指名料 + 追加項目
消費税10% = 小計 × 0.1
合計 = 小計 + 消費税 - 食堂利用料
```

給与明細（sales-payroll）

```
[従業員セレクト]
[対象月セレクト]
[給与明細プレビュー]
[🖨️ 印刷ボタン]
```

#### タブ⑤：設定（sub-tabs）

従業員（settings-emps）

```
[従業員一覧（settings-emps）]  [+ 追加]
  - 氏名 / 契約種別・PIN:****
  - [編集]ボタン → empModal
```

ゴルフ場（settings-courses）

```
[ゴルフ場一覧（settings-courses）]  [+ 追加]
  - ゴルフ場名 / 締め日・食堂・指名
  - [編集]ボタン → courseModal
```

単価設定（settings-rates）

```
[ゴルフ場セレクト（rateCourseSel）]
[単価テーブル（rateTableWrap）]
  平日/土日区別あり：従業員×[契約金平日][契約金土日][給料平日][給料土日]
  区別なし：従業員×[契約金][給料]
[保存するボタン] → saveRateTable()
```

updateRateTable()：

* ゴルフ場選択時に動的生成
* 既存rates値を各inputに反映
* Firebaseのratesから取得

## モーダル一覧

### assignModal：従業員割り振り

```
[ゴルフ場名・日付]
[集合時間 time input]
[スタート時間 time input]
[コメント input]
[従業員チェックボックスリスト]
[確定するボタン] → shifts保存
```

### approveModal：シフト希望承認

```
[従業員名・日付]
[派遣先ゴルフ場セレクト]
[集合時間 time input]
[承認するボタン] → shiftRequest.status='approved' + shifts保存
```

### noticeModal：翌日連絡追加

```
[従業員セレクト]
[日付 date input]
[ゴルフ場セレクト]
[集合時間 time input]
[スタート時間 time input]
[コメント input]
[送信するボタン] → notices保存
```

### newReqModal：出勤依頼追加

```
[ゴルフ場セレクト]
[日付 date input]
[必要人数セレクト（1〜6名）]
[備考 input]
[追加するボタン] → requests保存
```

### empModal：従業員追加・編集

```
[氏名][PIN4桁][雇用形態セレクト]
[インボイス番号][メール]
[銀行名][支店名][口座番号][口座名義]
[保存するボタン] → employees保存
```

### courseModal：ゴルフ場追加・編集

```
[ゴルフ場名][住所][電話][担当者名][担当者メール]
[締め日セレクト（末日/10日/15日/20日/25日）]
[請求書発行日（締め日の〇日後）]
[支払期限]
[平日/土日祝区別：ON/OFF]
[食堂あり：チェックボックス]
[食堂利用料（税込）]
[負担区分：全員会社負担/全員従業員負担/個別設定]
[指名料あり：チェックボックス]
[指名料（税別）]
[追加項目（自由追加）]
  - [+ 追加項目を追加] → addExtraItem()
  - 各行：[名称][金額][加算/減算セレクト][✕削除]
[保存するボタン] → courses保存
```

### confirmModal：確認ダイアログ

```
[確認メッセージ]
[OK][キャンセル]
```

### Toast通知

* 画面下部中央にフローティング表示
* 2.4秒で自動消去
* `showToast(msg, dur=2400)`で呼び出し

## 主要JavaScript関数一覧

### 画面制御

```javascript
showScreen(id)     // メイン画面を切り替え
showSub(id)        // サブスクリーンを表示
hideSub(id)        // サブスクリーンを非表示
showModal(id)      // モーダルを開く
closeModal(id)     // モーダルを閉じる
showToast(msg)     // Toast通知表示
```

### 認証

```javascript
adminLogin()       // Googleログイン → adminScreen
logout()           // ログアウト → topScreen
pk(key)            // PINキー入力
pd()               // PIN削除
checkPin()         // PIN照合 → empScreen
```

### タブ制御

```javascript
setTab(name, el)             // 管理者メインタブ切り替え
setSTab(group, name, el)     // サブタブ切り替え
```

### データ表示

```javascript
renderDashboard(state)        // ダッシュボード全体更新
renderEmpList(state)          // 従業員設定一覧
renderCourseList(state)       // ゴルフ場設定一覧
renderEmpNotices()            // 従業員：翌日確認
renderEmpHistory()            // 従業員：出勤記録
renderShiftApplyList()        // 従業員：申請一覧
renderShiftConfirmed()        // 従業員：確定シフト
renderAdminCal()              // 管理者：カレンダー
updateRateTable()             // 単価設定テーブル生成
saveRateTable()               // 単価保存
```

### カレンダー

```javascript
renderApplyCal()   // 従業員：シフト申請カレンダー描画
calPrev()          // 前月
calNext()          // 翌月
toggleDate(ds, el) // 希望日ON/OFF
adminCalPrev()     // 管理者カレンダー前月
adminCalNext()     // 管理者カレンダー次月
```

### データ保存

```javascript
doPunch()                    // 打刻実行
approveAtt(id)               // 打刻承認
rejectAtt(id)                // 打刻却下
confirmNoticeById(id, btn)   // 翌日確認
addExtraItem()               // 追加項目行を追加
```

### ユーティリティ関数

```javascript
// 今日の日付 YYYY-MM-DD
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// 土日判定
function isWeekend(dateStr) {
  const d = new Date(dateStr);
  return d.getDay() === 0 || d.getDay() === 6;
}

// 給料計算
function calcWage(wageBase, contract, rounds) {
  const base = wageBase * rounds;
  if (contract === 'invoice_yes') return Math.round(base / 1.08 * 1.1);
  if (contract === 'invoice_no') return Math.round(base * 1.1);
  return base;
}

// 指名料計算
function calcNomination(nomFee, contract, count) {
  if (contract === 'invoice_yes') return Math.round(nomFee / 1.08 * 1.1 * count);
  if (contract === 'invoice_no') return Math.round(nomFee * 1.1 * count);
  return nomFee * count;
}
```

## 開発ルール（必須）

1. HTMLのid属性とgetElementById()は必ず一致させる
2. すべての関数を実装してから完成とする（未実装関数は作らない）
3. サンプルデータは一切含めない（すべてFirebaseから取得）
4. エラーハンドリング：Firebase未接続時はオフラインモード表示
5. レスポンシブ：スマートフォン（320px〜）でも操作しやすいサイズ
6. タップ操作：ボタンは最小44px、-webkit-tap-highlight-color:transparent
7. Firebase保存後にUI更新：onValueのリアルタイム同期で自動反映

## 会社情報（請求書に使用）

```
会社名：WIN STAR株式会社
住所：〒287-0012 千葉県香取市大倉丁406番地2
TEL：090-9819-8238
代表取締役：勝俣徳洋
登録番号：T9040001118011
振込先：千葉銀行富里支店 普通3680646 WIN STAR株式会社
```

## GitHubへのプッシュ

完成後、以下のコマンドでプッシュしてください：

```
git add index.html
git commit -m "CaddyPro v3: 完全新規作成"
git push origin main
```

公開URL：https://winwincaddy.github.io/caddypro/
