'use strict';
const BleadSl = require('../lib/blead-sl.js');
const blead = new BleadSl();

(async () => {
  let device_list = await blead.discover({ quick: true });
  let device_name = await device_list[0].getDeviceName();
  console.log(device_name);
  process.exit();
})();
