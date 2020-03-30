'use strict';
const noble = require('@abandonware/noble');

noble.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    noble.startScanning(['6e400001b5a3f393e0a9e50e24dcca9e'], false);
  }
});

noble.on('discover', (peripheral) => {
  const ad = peripheral.advertisement;
  console.log(ad);
  let manu = ad.manufacturerData;

  // manu の先頭 2 バイトは Bluetooth SIG が会員に発行した識別子
  // 0x01CE は HOUWA SYSTEM DESIGN, k.k. で登録されている
  // https://www.bluetooth.com/specifications/assigned-numbers/company-identifiers/
  if(manu.readUInt16LE(0) !== 0x01CE) {
    return;
  }

  noble.stopScanning();

  console.log('- デバイスが見つかりました:');
  console.log('  - id: ' + peripheral.id);
  console.log('  - manufacturerData: ' + ad.manufacturerData.length + ' bytes');
  console.log('    - ' + ad.manufacturerData.toString('hex'));
  investigate(peripheral);
});

async function investigate(peripheral) {
  await connect(peripheral);
  console.log('- コネクションを確立しました。');
  await wait(1000);

  console.log('- Service と Characteristic を取得...');
  console.log('-----------------------------');

  let chars = {};
  let service_list = await discoverServices(peripheral);
  console.log('- ' + service_list.length + ' 個の Service が見つかりました。');
  await wait(1000);
  for (let service of service_list) {
    console.log('- ' + service.uuid);
    let char_list = await discoverCharacteristics(service);
    for (let char of char_list) {
      if(char.uuid === '2a00') {
        chars.name = char;
      } else if(char.uuid === '6e400002b5a3f393e0a9e50e24dcca9e') {
        chars.command = char;
      } else if(char.uuid === '6e400003b5a3f393e0a9e50e24dcca9e') {
        chars.notify = char;
      }
      chars[char.uuid] = char;
      console.log('  - ' + char.uuid);
    }
  }
  console.log('-----------------------------');

  await wait(1000);

  // ------------------------------------------------------
  // chars.name = {
  //   ...
  //   _serviceUuid: '1800',
  //   uuid: '2a00',
  //   name: 'Device Name',
  //   type: 'org.bluetooth.characteristic.gap.device_name',
  //   properties: [ 'read', 'write' ],
  //   descriptors: null
  // }
  //
  // chars.command = {
  //   ...
  //   _serviceUuid: '6e400001b5a3f393e0a9e50e24dcca9e',
  //   uuid: '6e400002b5a3f393e0a9e50e24dcca9e',
  //   name: null,
  //   type: null,
  //   properties: [ 'writeWithoutResponse', 'write' ],
  //   descriptors: null
  // }
  //
  // chars.notify = {
  //   ...
  //   _serviceUuid: '6e400001b5a3f393e0a9e50e24dcca9e',
  //   uuid: '6e400003b5a3f393e0a9e50e24dcca9e',
  //   name: null,
  //   type: null,
  //   properties: [ 'notify' ],
  //   descriptors: null
  // }
  // ------------------------------------------------------

  let dev_name_buf = await charRead(chars.name);
  console.log('- デバイス名: ' + dev_name_buf.toString('utf8'));

  await charSubscribe(chars.notify);
  chars.notify.on('data', (data) => {
    console.log(data);
  });

  console.log('- ブザーを 5 回鳴らします。');
  await charWrite(chars.command, 'BUZ 5');

  console.log('- 3 秒待ちます。');
  await wait(3000);

  await charUnsubscribe(chars.notify);
  await wait(1000);

  await disconnect(peripheral);
  console.log('- コネクションを切断しました。');
  process.exit(0);
}

function wait(msec) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, msec);
  });
}

function connect(peripheral) {
  return new Promise((resolve, reject) => {
    peripheral.connect((error) => {
      if(error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function disconnect(peripheral) {
  return new Promise((resolve, reject) => {
    peripheral.disconnect((error) => {
      if(error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function discoverServices(peripheral) {
  return new Promise((resolve, reject) => {
    peripheral.discoverServices([], (error, service_list) => {
      if(error) {
        reject(error);
      } else {
        resolve(service_list);
      }
    });
  });
}

function discoverCharacteristics(service) {
  return new Promise((resolve, reject) => {
    service.discoverCharacteristics([], (error, char_list) => {
      if(error) {
        reject(error);
      } else {
        resolve(char_list);
      }
    });
  });
}

function charRead(char) {
  return new Promise((resolve, reject) => {
    char.read((error, data) => {
      if(error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

function charWrite(char, data) {
  return new Promise((resolve, reject) => {
    let buf = null;
    if(Buffer.isBuffer(data)) {
      buf = data;
    } else if(typeof(data) === 'string') {
      buf = Buffer.from(data, 'utf8');
    }

    char.write(buf, false, (error) => {
      if(error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function charSubscribe(char) {
  return new Promise((resolve, reject) => {
    char.subscribe((error) => {
      if(error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function charUnsubscribe(char) {
  return new Promise((resolve, reject) => {
    char.unsubscribe((error) => {
      if(error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
