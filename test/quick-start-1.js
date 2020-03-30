'use strict';

// node-blead-sl をロードして `BleadSl` コンストラクタオブジェクトを取得
const BleadSl = require('../lib/blead-sl.js');
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