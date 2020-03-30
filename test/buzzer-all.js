'use strict';
const BleadSl = require('../lib/blead-sl.js');
const blead = new BleadSl();

(async () => {
  console.log('BLEAD-SL を発見します...');
  let device_list = await blead.discover({ duration: 5000 });
  let num = device_list.length;
  console.log('- ' + num + ' 個の BLEAD-SL を発見しました。');
  console.log('- すべての BLEAD-SL のブザーを鳴らします...');

  for (let device of device_list) {
    device.buzzer({ times: 20 }).then(() => {
      num --;
      if(num === 0) {
        console.log('- 完了。');
        process.exit();
      }

    });
    await wait(100);
  }

})();

function wait(msec) {
  return new Promise((resolve) => {
    setTimeout(resolve, msec);
  });
}