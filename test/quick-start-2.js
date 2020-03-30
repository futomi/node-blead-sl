'use strict';

const BleadSl = require('../lib/blead-sl.js');
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