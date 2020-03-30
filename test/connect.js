'use strict';
const BleadSl = require('../lib/blead-sl.js');
const blead = new BleadSl();

let device = null;

blead.discover({ quick: true }).then((device_list) => {
  device = device_list[0];
  if (!device) {
    console.log('No device was found.');
    process.exit();
  }
  console.log('A device was found.');
  console.log('- id     : ' + device.id);
  console.log('- address: ' + device.address);

  // Set event handers
  device.onconnect = () => {
    console.log('[NOTIFY] Connected.');
  };
  device.ondisconnect = () => {
    console.log('[NOTIFY] Disconnected.');
  };

  console.log('Connecting...');
  return device.connect();
}).then(() => {
  console.log('Turn on the buzzer and the LEDs...');
  return device.buzzer({ times: 50 });
}).then(() => {
  console.log('Waiting for 5 seconds...');
  return device.wait(5000);
}).then(() => {
  console.log('Stopping the buzzer ringing and LED flashing...');
  return device.stop();
}).then(() => {
  console.log('Disconnecting...');
  return device.disconnect();
}).then(() => {
  console.log('Done.');
}).catch((error) => {
  console.error(error);
}).finally(() => {
  process.exit();
});