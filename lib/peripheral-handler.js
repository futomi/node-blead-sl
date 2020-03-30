/* ------------------------------------------------------------------
* node-blead-sl - peripheral-handler.js
* - Promisify some methods of Noble and add the timeout mechanism
*
* Copyright (c) 2019, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2020-03-30
* ---------------------------------------------------------------- */
'use strict';

class PeripheralHandler {
  /* ------------------------------------------------------------------
  * Constructor
  *	
  * [Arguments]
  * - peripheral | Object | Required | The `peripheral` object of noble,
  *              |        |          | which represents this device
  * ---------------------------------------------------------------- */
  constructor(peripheral) {
    this._peripheral = peripheral;
    this._COMMON_TIMEOUT_MSEC = 3000;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this._peripheral.state === 'connected') {
        resolve();
        return;
      }

      let timer = setTimeout(() => {
        timer = null;
        if (this._peripheral.state === 'connected') {
          resolve();
        } else {
          reject(new Error('PERIPHERAL_CONNECT_TIMEOUT'));
        }
      }, this._COMMON_TIMEOUT_MSEC);

      this._peripheral.connect((error) => {
        if (timer) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      });
    });
  }

  disconnect() {
    return new Promise((resolve, reject) => {
      if (this._peripheral.state === 'disconnected') {
        resolve();
        return;
      }

      let timer = setTimeout(() => {
        timer = null;
        if (this._peripheral.state === 'disconnected') {
          resolve();
        } else {
          reject(new Error('PERIPHERAL_DISCONNECT_TIMEOUT'));
        }
      }, this._COMMON_TIMEOUT_MSEC);

      this._peripheral.disconnect((error) => {
        if (timer) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      });
    });
  }

  discoverServices(service_uuids) {
    return new Promise((resolve, reject) => {
      if (this._peripheral.state !== 'connected') {
        reject(new Error('The peripheral is not connected.'));
        return;
      }

      let timer = setTimeout(() => {
        timer = null;
        reject(new Error('PERIPHERAL_DISCOVER_TIMEOUT'));
      }, this._COMMON_TIMEOUT_MSEC);

      this._peripheral.discoverServices(service_uuids, (error, services) => {
        if (timer) {
          if (error) {
            reject(error);
          } else {
            resolve(services);
          }
        }
      });
    });
  }

  serviceDiscoverCharacteristics(service, char_uuids) {
    return new Promise((resolve, reject) => {
      if (this._peripheral.state !== 'connected') {
        reject(new Error('The peripheral is not connected.'));
        return;
      }

      let timer = setTimeout(() => {
        timer = null;
        reject(new Error('SERVICE_DISCOVER_TIMEOUT'));
      }, this._COMMON_TIMEOUT_MSEC);

      service.discoverCharacteristics(char_uuids, (error, characteristics) => {
        if (timer) {
          if (error) {
            reject(error);
          } else {
            resolve(characteristics);
          }
        }
      });
    });
  }

  characteristicRead(characteristic) {
    return new Promise((resolve, reject) => {
      if (this._peripheral.state !== 'connected') {
        reject(new Error('The peripheral is not connected.'));
        return;
      }

      let timer = setTimeout(() => {
        timer = null;
        reject(new Error('CHARACTERISTIC_READ_TIMEOUT'));
      }, this._COMMON_TIMEOUT_MSEC);

      characteristic.read((error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  characteristicWrite(characteristic, data, without_response) {
    return new Promise((resolve, reject) => {
      if (this._peripheral.state !== 'connected') {
        reject(new Error('The peripheral is not connected.'));
        return;
      }

      let timer = setTimeout(() => {
        timer = null;
        reject(new Error('CHARACTERISTIC_WRITE_TIMEOUT'));
      }, this._COMMON_TIMEOUT_MSEC);

      characteristic.write(data, without_response, (error) => {
        if (timer) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      });
    });
  }

  characteristicSubscribe(characteristic) {
    return new Promise((resolve, reject) => {
      if (this._peripheral.state !== 'connected') {
        reject(new Error('The peripheral is not connected.'));
        return;
      }

      let timer = setTimeout(() => {
        timer = null;
        reject(new Error('CHARACTERISTIC_SUBSCRIBE_TIMEOUT'));
      }, this._COMMON_TIMEOUT_MSEC);

      characteristic.subscribe((error) => {
        if (timer) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      });
    });
  }

  characteristicUnsubscribe(characteristic) {
    return new Promise((resolve, reject) => {
      if (this._peripheral.state !== 'connected') {
        reject(new Error('The peripheral is not connected.'));
        return;
      }

      let timer = setTimeout(() => {
        timer = null;
        reject(new Error('CHARACTERISTIC_UNSUBSCRIBE_TIMEOUT'));
      }, this._COMMON_TIMEOUT_MSEC);

      characteristic.unsubscribe((error) => {
        if (timer) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      });
    });
  }

}

module.exports = PeripheralHandler;
