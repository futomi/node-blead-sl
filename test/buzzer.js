'use strict';
const BleadSl = require('../lib/blead-sl.js');
const blead = new BleadSl();

blead.discover({ quick: true }).then((device_list) => {
  let device = device_list[0];
  if(!device) {
    throw new Error('No device was found.');
  }
  return device.buzzer({ times: 3 });
}).then(() => {
  console.log('Done.');
}).catch((error) => {
  console.error(error);
}).finally(() => {
  process.exit();
});