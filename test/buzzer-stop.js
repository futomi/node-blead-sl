'use strict';
const BleadSl = require('../lib/blead-sl.js');
const blead = new BleadSl();

(async () => {
  let device_list = await blead.discover({ quick: true });
  let device = device_list[0];
  if (!device) {
    throw new Error('No device was found.');
  }
  console.log('A device was found.');
  console.log('Turning on the buzzer...');
  await device.buzzer({ times: 40 });
  console.log('Done.');
  await device.wait(5000);
  console.log('Stopping the buzzer...');
  await device.stop();
  console.log('Done.');
})().catch((error) => {
  console.log('----------------------------');
  console.error(error);
}).finally(() => {
  process.exit();
});