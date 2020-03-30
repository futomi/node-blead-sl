'use strict';
const BleadSl = require('../lib/blead-sl.js');
const blead = new BleadSl();

(async () => {
  let device_list = await blead.discover({ quick: true });
  //await device_list[0].setDeviceName('棚3-2-1');
  await device_list[0].setDeviceName('BLEAD-SL');
  process.exit();
})();
