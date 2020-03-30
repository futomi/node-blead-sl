'use strict';

// `Noble` オブジェクトを生成
const noble = require('@abandonware/noble');

// `BleadSl` オブジェクトを生成
const BleadSl = require('../lib/blead-sl.js');
const blead = new BleadSl({noble: noble});

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