/* ------------------------------------------------------------------
* node-blead-sl - blead-bl-device.js
*
* Copyright (c) 2020, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2020-03-30
* ---------------------------------------------------------------- */
'use strict';
const parameterChecker = require('./parameter-checker.js');
const bleadBlAdvertising = require('./blead-sl-advertising.js');
const PeripheralHandler = require('./peripheral-handler.js');

class BleadBlDevice {
  /* ------------------------------------------------------------------
  * Constructor
  *	
  * [Arguments]
  * - peripheral | Object | Required | The `peripheral` object of noble,
  *              |        |          | which represents this device
  * ---------------------------------------------------------------- */
  constructor(peripheral) {
    this._peripheral = peripheral;
    this._peripheral_handler = new PeripheralHandler(peripheral);

    this._chars = null;

    this._SERV_UUID_PRIMARY = '6e400001b5a3f393e0a9e50e24dcca9e';
    this._CHAR_UUID_COMMAND = '6e400002b5a3f393e0a9e50e24dcca9e';
    this._CHAR_UUID_NOTIFY = '6e400003b5a3f393e0a9e50e24dcca9e';
    this._CHAR_UUID_DEVICE = '2a00';


    this._COMMAND_TIMEOUT_MSEC = 3000;

    this._CONNECT_TRIAL_NUM_MAX = 3;

    // Save the device information
    let ad = bleadBlAdvertising.parse(peripheral);
    this._id = ad.id;
    this._address = ad.address;
    this._battery = ad.battery;

    this._was_connected_explicitly = false;

    this._onconnect = () => { };
    this._ondisconnect = () => { };
    this._ondisconnect_internal = () => { };
    this._onnotify_internal = () => { };
  }

  // Getters
  get id() {
    return this._id;
  }

  get address() {
    return this._address;
  }

  get battery() {
    return this._battery;
  }

  get connectionState() {
    return this._peripheral.state;
  }

  // Setters
  set onconnect(func) {
    if (!func || typeof (func) !== 'function') {
      throw new Error('The `onconnect` must be a function.');
    }
    this._onconnect = func;
  }

  set ondisconnect(func) {
    if (!func || typeof (func) !== 'function') {
      throw new Error('The `ondisconnect` must be a function.');
    }
    this._ondisconnect = func;
  }

  /* ------------------------------------------------------------------
  * buzzer()
  * - Ring the buzzer and flash the LEDs on the BLEAD-SL
  *
  * [Arguments]
  * - params  | Object  | Optional |
  *   - times | Integer | Optional | Number of times the buzzer rings
  *           |         |          | The default value is 40.
  *
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  buzzer(params = {}) {
    return (async () => {
      // Check the parameters
      let valid = parameterChecker.check(params, {
        times: { required: false, type: 'integer', min: 1, max: 500 },
      }, false);

      if (!valid) {
        throw new Error(parameterChecker.error.message);
      }

      let times = 40;
      if (params && ('times' in params)) {
        times = params.times;
      }

      let cmd = 'BUZ ' + times;
      let res_str = await this.command(cmd);
      if (res_str !== 'OK') {
        throw new Error('An unknown response was received from the device: ' + res_str);
      }
      return;
    })();
  }

  /* ------------------------------------------------------------------
  * Stop()
  * - Stop buzzer ringing and LED flashing
  *
  * [Arguments]
  * - None
  *
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  stop() {
    return (async () => {
      let cmd = 'STP';
      let res_str = await this.command(cmd);
      if (res_str !== 'OK') {
        throw new Error('An unknown response was received from the device: ' + res_str);
      }
    })();
  }

  /* ------------------------------------------------------------------
  * connect()
  * - Connect the device
  *
  * [Arguments]
  * -  none
  *
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  connect() {
    this._was_connected_explicitly = true;
    return this._connect();
  }

  _connect() {
    return (async () => {
      // Check the connection state
      if (this.connectionState === 'connected') {
        return;
      }

      // Set event handlers for events fired on the `Peripheral` object
      this._peripheral.once('connect', () => {
        this._onconnect();
      });

      this._peripheral.once('disconnect', () => {
        this._chars = null;
        this._peripheral.removeAllListeners();
        this._ondisconnect_internal();
        this._ondisconnect();
      });

      let last_error = null;
      for (let i = 0; i < this._CONNECT_TRIAL_NUM_MAX; i++) {
        try {
          // Connect
          await this._peripheral_handler.connect();
          await this.wait(500);

          // Get all characteristics
          this._chars = await this._getCharacteristics();
          await this.wait(100);

          // Subscribe
          await this._peripheral_handler.characteristicSubscribe(this._chars.notify);
          this._chars.notify.on('data', (buf) => {
            this._onnotify_internal(buf);
          });
          await this.wait(100);
          last_error = null;
        } catch (e) {
          last_error = e;
        }

        if (last_error === null) {
          break;
        }
      }

      if (last_error) {
        throw last_error;
      }

    })();
  }

  _getCharacteristics() {
    return new Promise((resolve, reject) => {
      let timer = null;
      (async () => {
        // Set timeout timer
        timer = setTimeout(() => {
          throw new Error('Failed to discover services and characteristics: TIMEOUT');
        }, 5000);

        // Watch the connection state
        this._ondisconnect_internal = () => {
          throw new Error('Failed to discover services and characteristics: DISCONNECTED');
        };

        // Discover all services
        if (!timer) { return; }
        let service_list = await this._peripheral_handler.discoverServices([]);
        let is_service_found = false;
        for (let s of service_list) {
          if (s.uuid === this._SERV_UUID_PRIMARY) {
            is_service_found = true;
            break;
          }
        }
        if (!is_service_found) {
          throw new Error('No service was found.');
        }
        await this.wait(100);

        // Discover all characteristics
        let chars = {
          command: null,
          notify: null,
          device: null
        };

        for (let service of service_list) {
          if (!timer) { break; }
          let char_list = await this._peripheral_handler.serviceDiscoverCharacteristics(service);
          for (let char of char_list) {
            if (char.uuid === this._CHAR_UUID_COMMAND) {
              chars.command = char;
            } else if (char.uuid === this._CHAR_UUID_NOTIFY) {
              chars.notify = char;
            } else if (char.uuid === this._CHAR_UUID_DEVICE) {
              chars.device = char;
            }
          }
          await this.wait(100);
        }
        if (!timer) { return; }

        if (chars.command && chars.notify) {
          return chars;
        } else {
          throw new Error('No characteristic was found.');
        }

      })().then((chars) => {
        if (timer) {
          resolve(chars);
        }
      }).catch((error) => {
        if (timer) {
          reject(error);
        }
      }).finally(() => {
        if (timer) {
          clearTimeout(timer);
        }
        timer = null;
        this._ondisconnect_internal = () => { };
      });
    });
  }

  /* ------------------------------------------------------------------
  * disconnect()
  * - Disconnect the device
  *
  * [Arguments]
  * -  none
  *
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  disconnect() {
    return (async () => {
      this._was_connected_explicitly = false;

      let char = this._chars.notify;
      if (char) {
        char.removeAllListeners();
        //await this._peripheral_handler.characteristicUnsubscribe(char);
      }

      await this._peripheral_handler.disconnect();
      this._chars = null;
    })();
  }

  _disconnect() {
    return (async () => {
      if (!this._was_connected_explicitly) {
        await this.disconnect();
      }
      return;
    })();
  }

  /* ------------------------------------------------------------------
  * getDeviceName()
  * - Retrieve the device name
  *
  * [Arguments]
  * -  none
  *
  * [Returen value]
  * - Promise object
  *   The device name will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  getDeviceName() {
    return (async () => {
      await this._connect();
      if (!this._chars.device) {
        throw new Error('The device does not support the characteristic UUID 0x' + this._CHAR_UUID_DEVICE + '.');
      }
      let buf = await this._peripheral_handler.characteristicRead(this._chars.device);
      let name = buf.toString('utf8');
      await this._disconnect();
      return name;
    })();
  }

  /* ------------------------------------------------------------------
  * setDeviceName(name)
  * - Set the device name
  *
  * [Arguments]
  * - name | String | Required | Device name. The bytes length of the name
  *        |        |          | must be in the range of 1 to 20 bytes.
  *
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  setDeviceName(name) {
    return (async () => {
      let valid = parameterChecker.check({ name: name }, {
        name: { required: true, type: 'string', minBytes: 1, maxBytes: 20 }
      });

      if (!valid) {
        throw new Error(parameterChecker.error.message);
      }

      let buf = Buffer.from(name, 'utf8');
      await this._connect();
      if (!this._chars.device) {
        throw new Error('The device does not support the characteristic UUID 0x' + this._CHAR_UUID_DEVICE + '.');
      }
      await this._peripheral_handler.characteristicWrite(this._chars.device, buf, false);
      await this._disconnect();
    })();
  }

  /* ------------------------------------------------------------------
  * command()
  * - Write the command to the command characteristic and
  *   receive the response from the notify characteristic
  *   with connection handling
  *
  * [Arguments]
  * - cmd  | String  | Required | e.g., "BUZ 3"
  *
  * [Returen value]
  * - Promise object
  *   The response from the device ("OK", "ERR") will be passed to
  *   the `resolve()`.
  * ---------------------------------------------------------------- */
  command(cmd) {
    return new Promise((resolve, reject) => {
      // Check the `cmd`
      if (!cmd || typeof (cmd) !== 'string') {
        reject(new Error('The `cmd` must be a non-empty string.'));
        return;
      }

      // Set the response timer
      let timer = null;
      let startResponseTimer = () => {
        this._onnotify_internal = (buf) => {
          this._onnotify_internal = () => { };
          let res = '';
          if (buf && Buffer.isBuffer(buf) && buf.length > 0) {
            res = buf.toString('utf8')
          }
          postProcessing(null, res);
        };
        timer = setTimeout(() => {
          postProcessing(new Error('COMMAND_TIMEOUT'));
        }, this._COMMAND_TIMEOUT_MSEC);
      };

      // Set the post processing
      let postProcessing = (error, res) => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        this._disconnect().then(() => {
          // Do nothing
        }).catch(() => {
          // Do nothing
        }).finally(() => {
          if (error) {
            reject(error);
          } else {
            resolve(res);
          }
        });
      };

      // Connect
      this._connect().then(() => {
        // Write the command
        let req_buf = Buffer.from(cmd, 'utf8');
        return this._peripheral_handler.characteristicWrite(this._chars.command, req_buf, false);
      }).then(() => {
        // Start the response timer
        startResponseTimer();
      }).catch((error) => {
        // Execute the post processing
        postProcessing(error);
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

module.exports = BleadBlDevice;