'use strict';
const BleadSl = require('../lib/blead-sl.js');
const blead = new BleadSl();

blead.discover({ quick: true }).then((device_list) => {
  return device_list[0].stop();
}).then(() => {
  console.log('Done.');
}).catch((error) => {
  console.error(error);
}).finally(() => {
  process.exit();
});