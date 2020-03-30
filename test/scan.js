'use strict';
const BleadSl = require('../lib/blead-sl.js');
const blead = new BleadSl();

// アドバタイジングパケットを受信したときのイベントハンドラ
blead.onadvertisement = (ad) => {
  console.log(ad);
};

//アドバタイジングパケットのスキャンを開始
blead.startScan({
  id: 'd2:72:d2:42:c7:43',
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