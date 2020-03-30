/* ------------------------------------------------------------------
* node-blead-sl - blead-bl-advertising.js
*
* Copyright (c) 2020, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2020-03-28
* ---------------------------------------------------------------- */
'use strict';

class BleadBlAdvertising {
  constructor() {
    // ---------------------------------------------------------------
    // Company identifier defined by Bluetooth SIG, Inc.
    // https://www.bluetooth.com/specifications/assigned-numbers/company-identifiers/
    // 0x01CE means HOUWA SYSTEM DESIGN, k.k. which is a manufacturer of BLEAD-SL.
    // ---------------------------------------------------------------
    this._COMPANY_ID = 0x01CE;
    this._PRIMARY_SERVICE_UUID = '6e400001b5a3f393e0a9e50e24dcca9e';
  }

  /* ------------------------------------------------------------------
  * parse(peripheral)
  * - Parse advertising packets coming from BLEAD-SL
  *
  * [Arguments]
  * - peripheral | Object  | Required | A `Peripheral` object of noble
  *
  * [Returen value]
  * - An object as follows:
  *
  * {
  *   id: 'c12e453e2008',
  *   address: 'c1:2e:45:3e:20:08',
  * }
  *
  * If the specified `Peripheral` does not represent BLEAD-SL,
  * this method will return `null`.
  * ---------------------------------------------------------------- */
  parse(peripheral) {
    let ad = peripheral.advertisement;
    if (!ad) {
      return null;
    }

    // Check the primary service UUID
    if(!ad.serviceUuids || !Array.isArray(ad.serviceUuids) || ad.serviceUuids.length === 0) {
      return null;
    }
    if(!ad.serviceUuids.includes(this._PRIMARY_SERVICE_UUID)) {
      return null;
    }

    // Check the the manufacturer data
    let manu = ad.manufacturerData;
    if (!manu || !Buffer.isBuffer(manu) || manu.length < 2) {
      return null;
    }

    // Check the company ID
    if(manu.readUInt16LE(0) !== this._COMPANY_ID) {
      return null;
    }

    // Battery level (mV)
    // - This value is experimental.
    // - I'm not sure the 2 bytes absolutely represent the battery level.
    let battery_level = null;
    if(manu.length >= 26) {
      battery_level = manu.readUInt16LE(24);
    }

    let data = {
      id: peripheral.id,
      address: peripheral.address,
      battery: battery_level
    };
    return data;
  }

}

module.exports = new BleadBlAdvertising();