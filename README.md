node-blead-sl
===============

node-blead-sl は芳和システムデザイン社のブザーと LED を内蔵した BLE ビーコン「[BLEAD-SL (ブリード エスエル)](https://houwa-js.co.jp/service/product/blead-sl/)」をコントロールする node モジュールです。このモジュールでは、BLEAD-SL の発見、ブザー音発生、ブザー音停止を行うことができます。

*このモジュールは芳和システムデザイン社公式または公認の node モジュールではなく、芳和システムデザイン社の[公式ブログの記事](https://houwa-js.co.jp/blog/2019/12/20191212/)を参考に開発した非公式・非公認の node モジュールです。*

## サポート OS

node-blead-sl は Raspbian や Ubuntu といった Linux ベースの OS で動作します。現時点では Windows や Mac をサポートしていません (もし [@abandonware/noble](https://github.com/abandonware/noble) が適切にインストールできれば動作する可能性はあります)。

## 依存関係

* [Node.js](https://nodejs.org/en/) 10 +
* [@abandonware/noble](https://github.com/abandonware/noble)

[@abandonware/noble](https://github.com/abandonware/noble) のインストールについては、[@abandonware/noble](https://github.com/abandonware/noble) のドキュメントをご覧ください。

このモジュールは Linux 環境においては root 権限で実行する必要がありますのでご注意ください。詳細は [@abandonware/noble](https://github.com/abandonware/noble) のドキュメントをご覧ください。

## インストール

[@abandonware/noble](https://github.com/abandonware/noble) をインストールする前に、いくつか Bluetooth に関連したライブラリーをインストールしてください。以下は OS が Ubuntu/Debian/Raspbian の場合の手順です。

```
$ sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
```

別の OS をご利用の場合は、[@abandonware/noble](https://github.com/abandonware/noble) のドキュメントに記載された手順に従ってください。

上記のライブラリーをインストールしたら、次のように [@abandonware/noble](https://github.com/abandonware/noble) と node-blead-sl をインストールしてください。

```
$ cd ~
$ npm install @abandonware/noble
$ npm install node-blead-sl
```

---------------------------------------
## 目次

* [クイックスタート](#Quick-Start)
  * [ブザー音発生](#Quick-Start-1)
  * [ブザー音停止](#Quick-Start-2)
* [`BleadBl` オブジェクト](#BleadBl-object)
  * [`discover()` メソッド](#BleadBl-discover-method)
  * [`ondiscover` イベントハンドラ](#BleadBl-ondiscover-event-handler)
  * [`scartScan()` メソッド](#BleadBl-startScan-method)
  * [`stopScan()` メソッド](#BleadBl-stopScan-method)
  * [`onadvertisement` イベントハンドラ](#BleadBl-onadvertisement-event-handler)
  * [`wait()` メソッド](#BleadBl-wait-method)
* [`BleadBlDevice` オブジェクト](#BleadBlDevice-object)
  * [プロパティ](#BleadBlDevice-properties)
  * [`getDeviceName()` メソッド](#BleadBlDevice-getDeviceName-method)
  * [`setDeviceName()` メソッド](#BleadBlDevice-setDeviceName-method)
  * [`buzzer()` メソッド](#BleadBlDevice-buzzer-method)
  * [`stop()` メソッド](#BleadBlDevice-stop-method)
  * [`wait()` メソッド](#BleadBlDevice-wait-method)
* [Advertisement オブジェクト](#Advertisement-object)
* [リリースノート](#Release-Note)
* [リファレンス](#References)
* [ライセンス](#License)

---------------------------------------
## <a id="Quick-Start">クイックスタート</a>

### <a id="Quick-Start-1">ブザー音発生</a>

次のサンプルコードは、BLEAD-SL を 1 つ発見し、5 回ブザーを鳴らします。

```javascript
// node-blead-sl をロードして `BleadSl` コンストラクタオブジェクトを取得
const BleadSl = require('node-blead-sl');
// `BleadSl` オブジェクトを生成
const blead = new BleadSl();

(async () => {
  // デバイス発見開始
  let device_list = await blead.discover({ quick: true });
  let device = device_list[0];
  if (!device) {
    throw new Error('デバイスが見つかりませんでした。');
  }

  // ブザーを 5 回鳴らす
  await device.buzzer({ times: 5 });
  process.exit();
})();
```

まず、[`BleadBl`](#BleadBl-object) オブジェクトの [`discover()`](#BleadBl-discover-method) メソッドを使って BLEAD-SL を発見します。パラメータ `quick` に `true` を指定しているため、1 つだけ見つかった時点で発見処理が終了します。

BLEAD-SL のブザーを鳴らすには、発見した BLEAD-SL を表す [`BleadBlDevice`](#BleadBlDevice-object) オブジェクトの [`buzzer()`](#BleadBlDevice-buzzer-method) メソッドを使います。このメソッドにはブザーを鳴らす回数を指定します。上記サンプルコードでは 5 回鳴らします。

なお、[`buzzer()`](#BleadBlDevice-buzzer-method) メソッドは、BLEAD-SL がコマンドを受け付けた時点で終了します。ブザー音発生が終了するまで待つわけではありませんので注意してください。

### <a id="Quick-Start-2">ブザー音停止</a>

前述の [`BleadBlDevice`](#BleadBlDevice-object) オブジェクトの [`buzzer()`](#BleadBlDevice-buzzer-method) メソッドを使ってブザーを鳴らし始めた後に、それをキャンセルしたい場合、つまり、ブザーを停止したい場合は、[`BleadBlDevice`](#BleadBlDevice-object) オブジェクトの [`stop()`](#BleadBlDevice-stop-method) メソッドを使います。

```javascript
const BleadSl = require('node-blead-sl');
const blead = new BleadSl();

(async () => {
  let device_list = await blead.discover({ quick: true });
  let device = device_list[0];
  if (!device) {
    throw new Error('デバイスが見つかりませんでした。');
  }

  // ブザーを 100 回鳴らす
  await device.buzzer({ times: 100 });
  // 5 秒待つ
  await device.wait(5000);
  // ブザーを停止する
  await device.stop();
  process.exit();
})();
```

上記サンプルコードでは [`buzzer()`](#BleadBlDevice-buzzer-method) メソッドを使って 100 回ブザーを鳴らす命令を投げています。その 5 秒後に [`stop()`](#BleadBlDevice-stop-method) メソッドを使ってブザー音発生をキャンセルしています。

---------------------------------------
## <a id="BleadBl-object">`BleadBl` オブジェクト</a>

node-blead-sl を利用するために、次のように node-blead-sl モジュールをロードします:

```JavaScript
const BleadSl = require('node-blead-sl');
```

上記コードから `BleadSl` コンストラクタを得ます。次に `BleadSl` コンストラクタから、次のように `BleadSl` オブジェクトを生成します:

```javascript
const blead = new BleadSl();
```

`BleadSl` コンストラクタは、オプションで 1 つの引数を取ります。次のパラメータを含んだハッシュオブジェクトでなければいけません:

プロパティ | 型     | 必須 | 説明
:----------|:--------|:-----|:-----------
`noble`    | `Noble` | 任意 | [`@abandonware/noble`](https://github.com/abandonware/noble) の `Noble` オブジェクト

node-blead-sl モジュールは、[`@abandonware/noble`](https://github.com/abandonware/noble) モジュールを使って BLE を扱います。もし `@abandonware/noble` モジュールを使って別の BLE デバイスを扱いたい場合は、あなた自身で `Noble` オブジェクトを生成し、それをこのモジュールに引き渡すことが可能です。もし `Noble` オブジェクトを `noble` プロパティに指定しなかった場合、このモジュールは内部で自動的に `Noble` オブジェクトを生成します。

以下のサンプルコードは、どうやって `Noble` オブジェクトを `BleadSl` コンストラクタに引き渡すのかを示しています:

```JavaScript
// `Noble` オブジェクトを生成
const noble = require('@abandonware/noble');

// `BleadSl` オブジェクトを生成
const BleadSl = require('node-blead-sl');
const blead = new BleadSl({noble: noble});
```

上記コードでは、変数 `blead` が `BleadSl` オブジェクトです。`BleadSl` オブジェクトは、以降で説明する通り、いくつかのメソッドを持っています。

### <a id="BleadBl-discover-method">`discover()` メソッド</a>

`discover` メソッドは BLEAD-SL が発する BLE アドバタイジングパケットをスキャンして BLEAD-SL を発見します。このメソッドは `Promise` オブジェクトを返します。このメソッドは、次のパラメータを含んだハッシュオブジェクトを引数にとります:

プロパティ    | 型      | 必須 | 説明
:------------|:--------|:-----|:------------
`duration`   | Integer | 任意 | 発見処理の時間 (ミリ秒)。デフォルト値は 5,000 ミリ秒。
`id`         | String  | 任意 | デバイスの id。指定した id のみを発見対象とし、それ以外は無視します。大文字・小文字は区別しません。コロンは無視されます。(例: `"d272d242c743"`, `"d2:72:d2:42:c7:43"`)
`quick`      | Boolean | 任意 | `true` を指定すると、このメソッドは `duration` の値にかかわらず、最初の 1 つが見つかった時点で `resolve()` を呼び出して終了します。デフォルト値は `false` です。

以下のサンプルコードは、パラメータを何も指定せずに、このメソッドを呼び出しています:

```JavaScript
blead.discover().then((device_list) => {
  // Do something...
}).catch((error) => {
  console.error(error);
});
```

上記サンプルコードのようにパラメータを何も指定しない場合、5 秒後に `resolve()` が呼び出され、`Array` オブジェクトが引き渡されます。その `Array` オブジェクトには、発見されたデバイスを表す [`BleadBlDevice`](#BleadBlDevice-object) オブジェクトが含まれています。詳細は [`BleadBlDevice`](#BleadBlDevice-object) オブジェクトのセクションをご覧ください。

もし 1 つのデバイスが発見された時点で応答が欲しい場合は、`quick` プロパティに `true` をセットすることができます:

```JavaScript
blead.discover({
    quick: true
  });
}).then((device_list) => {
  // Do something...
}).catch((error) => {
  console.error(error);
});
```

### <a id="BleadBl-ondiscover-event-handler">`ondiscover` イベントハンドラ</a>

[`BleadBl`](#BleadBl-object) オブジェクトの `ondiscover` プロパティは、発見処理でデバイスが新たに発見された都度呼び出されるイベントハンドラです。`ondiscover` プロパティにセットされたコールバック関数には、[`BleadBlDevice`](#BleadBlDevice-object) オブジェクトが引き渡されます。

```JavaScript
const BleadSl = require('node-blead-sl');
const blead = new BleadSl();

blead.ondiscover = (device) => {
  console.log('- ' + device.id);
  console.log('  - address: ' + device.address);
  console.log('  - battery: ' + device.battery);
};

blead.discover().then(() => {
  console.log('発見処理が終了しました。');
}).catch((error) => {
  console.error(error);
}).finally(() => {
  process.exit();
});
```

上記のサンプルコードは次のような結果を出力します:

```
- ec0d1ac5fcb5
  - address: ec:0d:1a:c5:fc:b5
  - battery: 3474
- d272d242c743
  - address: d2:72:d2:42:c7:43
  - battery: 3318
- c14d6f0afae8
  - address: c1:4d:6f:0a:fa:e8
  - battery: 3516

```

### <a id="BleadBl-startScan-method">`scartScan()` メソッド</a>

`startScan()` メソッドは、デバイスから送られてくるアドバタイジングパケットをスキャン開始します。このメソッドは次のようなパラメータを含んだハッシュオブジェクトを引数にとります:

プロパティ    | 型     | 必須      | 説明
:------------|:-------|:---------|:------------
`id`         | String  | Optional | デバイスの id。指定した id のみをスキャン対象とし、それ以外は無視します。大文字・小文字は区別しません。コロンは無視されます。(例: `"d272d242c743"`, `"d2:72:d2:42:c7:43"`)

パケットを受信する都度、[`BleadBlDevice`](#BleadBlDevice-object) オブジェクトの [`onadvertisement`](#BleadBl-onadvertisement-event-handler) プロパティにセットされたコールバック関数が呼び出されます。パケットを受信すると、そのパケットを表すハッシュオブジェクトがコールバック関数に引き渡されます。

```JavaScript
const BleadSl = require('node-blead-sl');
const blead = new BleadSl();

// アドバタイジングパケットを受信したときのイベントハンドラ
blead.onadvertisement = (ad) => {
  console.log(ad);
};

//アドバタイジングパケットのスキャンを開始
blead.startScan({
  //id: 'd2:72:d2:42:c7:43',
}).then(() => {
  // 3 秒待つ
  return blead.wait(3000);
}).then(() => {
  // スキャンを停止
  return blead.stopScan();
}).then(() => {
  console.log('スキャンを終了しました。');
}).catch((error) => {
  console.error(error);
}).finally(() => {
  process.exit();
});
```

上記サンプルコードは次のような結果を出力します:

```
{ id: 'd272d242c743', address: 'd2:72:d2:42:c7:43', battery: 3318 }
{ id: 'c14d6f0afae8', address: 'c1:4d:6f:0a:fa:e8', battery: 3501 }
{ id: 'ec0d1ac5fcb5', address: 'ec:0d:1a:c5:fc:b5', battery: 3486 }
{ id: 'ec0d1ac5fcb5', address: 'ec:0d:1a:c5:fc:b5', battery: 3486 }
{ id: 'c14d6f0afae8', address: 'c1:4d:6f:0a:fa:e8', battery: 3501 }
{ id: 'd272d242c743', address: 'd2:72:d2:42:c7:43', battery: 3318 }
{ id: 'c14d6f0afae8', address: 'c1:4d:6f:0a:fa:e8', battery: 3501 }
{ id: 'd272d242c743', address: 'd2:72:d2:42:c7:43', battery: 3318 }
スキャンを終了しました。
```

上記アドバタイジングパケットを表すオブジェクトの詳細は、"[`Advertisement` オブジェクト](#Advertisement-object)" のセクションをご覧ください。

### <a id="BleadBl-stopScan-method">`stopScan()` メソッド</a>

`stopScan()` メソッドは、デバイスから送られてくるアドバタイジングパケットのスキャンを停止します。このメソッドは `Promise` オブジェクトを返します。使い方については、"[`startScan()` メソッド](#BleadBl-startScan-method)" のセクションをご覧ください。

### <a id="BleadBl-onadvertisement-event-handler">`onadvertisement` イベントハンドラ</a>

`onadvertisement` プロパティにコールバック関数をセットすると、スキャンがアクティブの間 ([`startScan()`](#BleadBl-startScan-method) メソッドが呼び出されてから [`stopScan()`](#BleadBl-stopScan-method) メソッドが呼び出されるまでの間)、デバイスからアドバタイジングパケットを受信する都度、このコールバック関数が呼び出されます。使い方については、"[`startScan()` メソッド](#BleadBl-startScan-method)" のセクションをご覧ください。

### <a id="BleadBl-wait-method">`wait()` method</a>

`wait()` メソッドは指定したミリ秒だけ待ちます。このメソッドは待ち時間を表す整数 (ミリ秒) を引数にとります。このメソッドは `Promise` オブジェクトを返します。

このメソッドはデバイスに対して何も作用を及ぼしません。単なるユーティリティメソッドにすぎません。使い方については、"[`startScan()` メソッド](#BleadBl-startScan-method)" のセクションをご覧ください。

---------------------------------------
## <a id="BleadBlDevice-object">`BleadBlDevice` オブジェクト</a>

`BleadBlDevice` オブジェクトは BLEAD-SL を表し、[`BleadBl.discover()`](#BleadBl-discover-method) メソッドによって開始される発見処理を通して生成されます。

### <a id="BleadBlDevice-properties">プロパティ</a>

`BleadBlDevice` オブジェクトは次のプロパティをサポートしています:

プロパティ         | 型       | 説明
:-----------------|:---------|:-----------
`id`              | String   | デバイスの ID (例: `"d272d242c743"`)
`address`         | String   | デバイスの MAC アドレス。基本的に `:` がある点を除いて `id` の値と同じです。 (e.g., `"d2:72:d2:42:c7:43"`)
`battery`         | Inetger  | バッテリーレベル (mV) (実験的な実装)

`battery` は現時点では実験的な実装です。メーカー公式な情報から実装されたものではなく、作者がアドバタイジングパケットのデータから推測したものです。この値は正確でない可能性があることに加え、将来的には削除される可能性がありますので、注意してください。

### <a id="BleadBlDevice-getDeviceName-method">`getDeviceName()` メソッド</a>

`getDeviceName()` メソッドはデバイスに保存されたデバイス名を取得します。このメソッドは `Promise` オブジェクトを返します。デバイス名が取得できたら、`resolve()` に引き渡されます。

```javascript
const BleadSl = require('node-blead-sl');
const blead = new BleadSl();

(async () => {
  let device_list = await blead.discover({ quick: true });
  let device_name = await device_list[0].getDeviceName();
  console.log(device_name);
  process.exit();
})();
```

上記のサンプルコードは、次のような結果を出力します:

```javascript
BLEAD-SL
```

### <a id="BleadBlDevice-setDeviceName-method">`setDeviceName()` メソッド</a>

`setDeviceName()` メソッドは、第一引数に指定したデバイス名をデバイスに保存します。このメソッドは `Promise` オブジェクトを返します。`resolve()` には何も引き渡されません。

デバイスに保存されるデバイス名のキャラクターセットは UTF-8 です。名前のバイト長は 20 バイト以下でなければいけません。ASCII 文字だけからなる名前なら 20 文字まで許されますが、マルチバイト文字からなる名前なら、上限は半分以下になります。例えば、日本語の文字であれば多くて 6 文字まで保存できます。なぜなら、ほとんどの日本語の文字は 1 文字で 3 バイト消費するからです。

```javascript
const BleadSl = require('node-blead-sl');
const blead = new BleadSl();

(async () => {
  let device_list = await blead.discover({ quick: true });
  await device_list[0].setDeviceName('棚3-2-1');
  process.exit();
})();
```

### <a id="BleadBlDevice-buzzer-method">`buzzer()` メソッド</a>

`turnOn()` メソッドは、BLEAD-SL のブザーを指定回数分だけ鳴らせます。同時に BLEAD-SL では LED が点灯します。このメソッドは `Promise` オブジェクトを返します。`resolve()` には何も引き渡されません。

このメソッドは次のようなパラメータを含んだハッシュオブジェクトを引数にとります:

プロパティ    | 型      | 必須      | 説明
:------------|:--------|:---------|:------------
`times`      | Integer | Optional | ブザーを鳴らす回数 (1 ～ 500)。デフォルト値は 40。

使い方については、[クイックスタート](#Quick-Start)のセクションをご覧ください。

### <a id="BleadBlDevice-stop-method">`stop()` メソッド</a>

`stop()` メソッドは、BLEAD-SL のブザーを停止します。このメソッドは `Promise` オブジェクトを返します。`resolve()` には何も引き渡されません。

使い方については、[クイックスタート](#Quick-Start)のセクションをご覧ください。

### <a id="BleadBlDevice-wait-method">`wait()` メソッド</a>

`wait()` メソッドは指定したミリ秒だけ待ちます。このメソッドは待ち時間を表す整数 (ミリ秒) を引数にとります。このメソッドは `Promise` オブジェクトを返します。

このメソッドはデバイスに対して何も作用を及ぼしません。単なるユーティリティメソッドにすぎません。使い方については、"[クイックスタート](#Quick-Start)" のセクションをご覧ください。

---------------------------------------
## <a id="Advertisement-object">`Advertisement` オブジェクト</a>

[`startScan()`](#BleadBl-startScan-method) メソッドが呼び出さると、デバイスからアドバタイジングパケットを受信するたびに [`onadvertisement`](#BleadBl-onadvertisement-event-handler) イベントハンドラが呼び出されます。そのイベントハンドラには、次のプロパティを含んだオブジェクトが引き渡されます:


プロパティ         | 型       | 説明
:-----------------|:---------|:-----------
`id`              | String   | デバイスの ID (例: `"d272d242c743"`)
`address`         | String   | デバイスの MAC アドレス。基本的に `:` がある点を除いて `id` の値と同じです。 (e.g., `"d2:72:d2:42:c7:43"`)
`battery`         | Inetger  | バッテリーレベル (mV) (実験的な実装)

`battery` は現時点では実験的な実装です。メーカー公式な情報から実装されたものではなく、送られてくるアドバタイジングパケットのデータから作者が推定したものです。この値は正確でない可能性があることに加え、将来的には削除される可能性がありますので、注意してください。

`Advertisement` オブジェクトの例:

```javascript
{ id: 'd272d242c743', address: 'd2:72:d2:42:c7:43', battery: 3333 }
```

---------------------------------------
## <a id="Release-Note">リリースノート</a>

* v0.0.1 (2020-03-31)
  * First public release

---------------------------------------
## <a id="References">リファレンス</a>

* [BLEAD-SL (ブリード エスエル)](https://houwa-js.co.jp/service/product/blead-sl/)
* [Windows でも BLE を扱うことは可能か？〜できるかどうかやってみた〜](https://houwa-js.co.jp/blog/2019/12/20191212/)

---------------------------------------
## <a id="License">ライセンス</a>

The MIT License (MIT)

Copyright (c) 2020 Futomi Hatano

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
