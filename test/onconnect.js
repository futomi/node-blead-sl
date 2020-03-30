'use strict';
const BleadSl = require('../lib/blead-sl.js');
const blead = new BleadSl();

blead.discover({ quick: true }).then((device_list) => {
  let device = device_list[0];
  if (!device) {
    console.log('No device was found.');
    process.exit();
  }
  console.log('A device was found.');
  console.log('- id     : ' + device.id);
  console.log('- address: ' + device.address);

  // Set event handers
  device.onconnect = () => {
    console.log('Connected.');
  };
  device.ondisconnect = () => {
    console.log('Disconnected.');
  };

  console.log('Turn on the buzzer and the LEDs...');
  return device.callUp({ times: 5 });
}).then(() => {
  console.log('Done.');
}).catch((error) => {
  console.error(error);
}).finally(() => {
  process.exit();
});