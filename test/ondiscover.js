'use strict';
const BleadSl = require('../lib/blead-sl.js');
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
