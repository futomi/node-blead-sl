/* ------------------------------------------------------------------
* node-blead-sl - blead-sl.js
*
* Copyright (c) 2020, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2020-03-28
* ---------------------------------------------------------------- */
'use strict';
const parameterChecker = require('./parameter-checker.js');
const bleadBlAdvertising = require('./blead-sl-advertising.js');
const BleadBlDevice = require('./blead-sl-device.js');

class BleadBl {
  /* ------------------------------------------------------------------
  * Constructor
  *	
  * [Arguments]
  * - params  | Object  | Optional |
  *   - noble | Noble   | Optional | The Nobel object created by the noble module.
  *           |         |          | This parameter is optional.
  *           |         |          | If you don't specify this parameter, this
  *           |         |          | module automatically creates it.
  * ---------------------------------------------------------------- */
  constructor(params) {
    // Check parameters
    let noble = null;
    if (params && params.noble) {
      noble = params.noble;
    } else {
      noble = require('@abandonware/noble');
    }

    this.noble = noble;
    this._ondiscover = null;
    this._onadvertisement = null;

    this._initialized = false;
    this._DEFAULT_DISCOVERY_DURATION = 5000
    this._PRIMARY_SERVICE_UUID_LIST = ['6e400001b5a3f393e0a9e50e24dcca9e'];
  };

  set ondiscover(func) {
    if (!func || typeof (func) !== 'function') {
      throw new Error('The `ondiscover` must be a function.');
    }
    this._ondiscover = func;
  }

  set onadvertisement(func) {
    if (!func || typeof (func) !== 'function') {
      throw new Error('The `onadvertisement` must be a function.');
    }
    this._onadvertisement = func;
  }

  /* ------------------------------------------------------------------
  * discover([params])
  * - Discover BLEAD-SL
  *
  * [Arguments]
  * - params     | Object  | Optional |
  *   - duration | Integer | Optional | Duration for discovery process (msec).
  *              |         |          | The value must be in the range of 1 to 60000.
  *              |         |          | The default value is 5000 (msec).
  *   - id       | String  | Optional | If this value is set, this method will discover
  *              |         |          | only a device whose ID is as same as this value.
  *              |         |          | The ID is identical to the MAC address.
  *              |         |          | This parameter is case-insensitive, and
  *              |         |          | colons are ignored.
  *   - quick    | Boolean | Optional | If this value is true, this method finishes
  *              |         |          | the discovery process when the first device
  *              |         |          | is found, then calls the resolve() function
  *              |         |          | without waiting the specified duration.
  *              |         |          | The default value is false.
  *
  * [Returen value]
  * - Promise object
  *   An array will be passed to the `resolve()`, which includes
  *   `BleadBlDevice` objects representing the found devices.
  * ---------------------------------------------------------------- */
  discover(params = {}) {
    return new Promise((resolve, reject) => {
      // Check the parameters
      let valid = parameterChecker.check(params, {
        duration: { required: false, type: 'integer', min: 1, max: 60000 },
        id: { required: false, type: 'string', min: 12, max: 17 },
        quick: { required: false, type: 'boolean' }
      }, false);

      if (!valid) {
        reject(new Error(parameterChecker.error.message));
        return;
      }

      if (!params) {
        params = {};
      }

      // Determine the values of the parameters
      let p = {
        duration: params.duration || this._DEFAULT_DISCOVERY_DURATION,
        id: params.id || '',
        quick: params.quick ? true : false
      };

      // Initialize the noble object
      this._init().then(() => {
        let peripherals = {};
        let timer = null;
        let finishDiscovery = () => {
          if (timer) {
            clearTimeout(timer);
          }
          this.noble.removeAllListeners('discover');
          this.noble.stopScanning();
          let device_list = [];
          for (let addr in peripherals) {
            device_list.push(peripherals[addr]);
          }
          resolve(device_list);
        };

        // Set an handler for the 'discover' event
        this.noble.on('discover', (peripheral) => {
          let device = this._getDeviceObject(peripheral, p.id);
          if (!device) {
            return;
          }
          let id = device.id;
          peripherals[id] = device;

          if (this._ondiscover && typeof (this._ondiscover) === 'function') {
            this._ondiscover(device);
          }

          if (p.quick) {
            finishDiscovery();
            return;
          }
        });

        // Start scaning
        this.noble.startScanning(this._PRIMARY_SERVICE_UUID_LIST, false, (error) => {
          if (error) {
            reject(error);
            return;
          }
          timer = setTimeout(() => {
            finishDiscovery();
          }, p.duration);
        });
      }).catch((error) => {
        reject(error);
      });
    });
  }

  _init() {
    return new Promise((resolve, reject) => {
      if (this._initialized === true) {
        resolve();
        return;
      }
      if (this.noble.state === 'poweredOn') {
        this._initialized = true;
        resolve();
      } else {
        this.noble.once('stateChange', (state) => {
          if (state === 'poweredOn') {
            this._initialized = true;
            resolve();
          } else {
            let err = new Error('Failed to initialize the Noble object: ' + state);
            reject(err);
          }
        });
      }
    });
  }

  _getDeviceObject(peripheral, id, model) {
    let ad = bleadBlAdvertising.parse(peripheral);
    if (this._filterAdvertising(ad, id, model)) {
      let device = new BleadBlDevice(peripheral);
      return device;
    } else {
      return null;
    }
  }

  _filterAdvertising(ad, id) {
    if (!ad) {
      return false;
    }
    if (id) {
      id = id.toLowerCase().replace(/\:/g, '');
      if (ad.id !== id) {
        return false;
      }
    }
    return true;
  }

  /* ------------------------------------------------------------------
  * startScan([params])
  * - Start to monitor advertising packets coming from BLEAD-SL
  *
  * [Arguments]
  * - params     | Object  | Optional |
  *   - id       | String  | Optional | If this value is set, the `onadvertisement`
  *              |         |          | event hander will be called only when advertising
  *              |         |          | packets comes from devices whose ID is as same as
  *              |         |          | this value.
  *              |         |          | The ID is identical to the MAC address.
  *              |         |          | This parameter is case-insensitive, and
  *              |         |          | colons are ignored.
  *
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  startScan(params) {
    return new Promise((resolve, reject) => {
      // Check the parameters
      let valid = parameterChecker.check(params, {
        id: { required: false, type: 'string', min: 12, max: 17 },
      }, false);

      if (!valid) {
        reject(new Error(parameterChecker.error.message));
        return;
      }

      if (!params) {
        params = {};
      }

      // Initialize the noble object
      this._init().then(() => {

        // Determine the values of the parameters
        let p = {
          id: params.id || ''
        };

        // Set an handler for the 'discover' event
        this.noble.on('discover', (peripheral) => {
          let ad = bleadBlAdvertising.parse(peripheral);
          if (this._filterAdvertising(ad, p.id)) {
            if (this._onadvertisement && typeof (this._onadvertisement) === 'function') {
              this._onadvertisement(ad);
            }
          }
        });

        // Start scaning
        this.noble.startScanning(this._PRIMARY_SERVICE_UUID_LIST, true, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      }).catch((error) => {
        reject(error);
      });
    });
  };

  /* ------------------------------------------------------------------
  * stopScan()
  * - Stop to monitor advertising packets coming from BLEAD-SL
  *
  * [Arguments]
  * - none
  *
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  stopScan() {
    return new Promise((resolve, reject) => {
      this.noble.removeAllListeners('discover');
      this.noble.stopScanning((error) => {
        if(error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /* ------------------------------------------------------------------
  * wait(msec) {
  * - Wait for the specified time (msec)
  *
  * [Arguments]
  * - msec | Integer | Required | Msec.
  *
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  wait(msec) {
    return new Promise((resolve, reject) => {
      // Check the parameters
      let valid = parameterChecker.check({ msec: msec }, {
        msec: { required: true, type: 'integer', min: 0 }
      });

      if (!valid) {
        reject(new Error(parameterChecker.error.message));
        return;
      }
      // Set a timer
      setTimeout(resolve, msec);
    });
  }

}

module.exports = BleadBl;
