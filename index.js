'use strict';

var util = require('util');
var bleno = require('bleno');
var objectAssign = require('object-assign');
var BlenoCharacteristic = require('bleno').Characteristic;
var BlenoPrimaryService = bleno.PrimaryService;
var EventEmitter = require('events').EventEmitter;

var TX_POWER_MODE_HIGH = 3;
var TX_POWER_MODE_MEDIUM = 2;
var TX_POWER_MODE_LOW = 1;
var TX_POWER_MODE_LOWEST = 0;
var BEACON_PERIOD_LOWEST = 10;

function EddystoneConfigService() {
	this.beaconConfig = {
		name: 'Eddystone-URL Configuration Service',
		lockState: false,
		uri: 'http://google.com',
		flags: 0,
		txPowerLevel: 0,
		txPowerMode: 0,
		beaconPeriod: 0,
		disabled: true
	};

	this.characteristics = {
		lockState: {
			uuid: 'ee0c2081-8786-40ba-ab96-99b91ac981d8',
			properties: ['read'],
			onReadRequest: this._readLockState.bind(this)
		},
		lock: {
			uuid: 'ee0c2082-8786-40ba-ab96-99b91ac981d8',
			properties: ['read']
		},
		unlock: {
			uuid: 'ee0c2083-8786-40ba-ab96-99b91ac981d8',
			properties: ['writeWithoutResponse']
		},
		uriData: {
			uuid: 'ee0c2084-8786-40ba-ab96-99b91ac981d8',
			properties: ['read', 'write'],
			onWriteRequest: this._writeUriData.bind(this),
			onReadRequest: this._readUriData.bind(this)
		},
		flags: {
			uuid: 'ee0c2085-8786-40ba-ab96-99b91ac981d8',
			properties: ['read', 'write'],
			onWriteRequest: this._writeFlags.bind(this),
			onReadRequest: this._readFlags.bind(this)
		},
		txPowerLevel: {
			uuid: 'ee0c2086-8786-40ba-ab96-99b91ac981d8',
			properties: ['read', 'write'],
			onReadRequest: this._readTxPowerLevel.bind(this),
			onWriteRequest: this._writeTxPowerLevel.bind(this)
		},
		txPowerMode: {
			uuid: 'ee0c2087-8786-40ba-ab96-99b91ac981d8',
			properties: ['read', 'write'],
			onReadRequest: this._readTxPowerMode.bind(this),
			onWriteRequest: this._writeTxPowerMode.bind(this)
		},
		beaconPeriod: {
			uuid: 'ee0c2088-8786-40ba-ab96-99b91ac981d8',
			properties: ['read', 'write'],
			onReadRequest: this._readBeaconPeriod.bind(this),
			onWriteRequest: this._writeBeaconPeriod.bind(this)
		},
		reset: {
			uuid: 'ee0c2089-8786-40ba-ab96-99b91ac981d8',
			properties: ['writeWithoutResponse'],
			onWriteRequest: this._reset.bind(this)
		}
	};
}

util.inherits(EddystoneConfigService, EventEmitter);

EddystoneConfigService.prototype._writeBoolean = function (bool) {
	var data = new Buffer(1);
	data.fill(bool ? 1 : 0);
	return data;
};

EddystoneConfigService.prototype._readLockState = function (offset, cb) {
	this.emit('lockState', {
		properties: ['read'],
		offset: offset
	}, function(err, opts) {
		if (!opts || opts.lockState) {
			throw new Error('Invalid lock state');
		}
		cb(err, this._writeBoolean(opts.lockState));
	}.bind(this));
};

EddystoneConfigService.prototype._writeUriData = function (data, offset, withoutResponse, cb) {
	this.beaconConfig.uri = data;
	this.emit('uriData', 'write', this.beaconConfig.uri.toString(), data);
	cb(BlenoCharacteristic.RESULT_SUCCESS);
};

EddystoneConfigService.prototype._readUriData = function (offset, cb) {
	this.emit('uriData', 'read', this.beaconConfig.uri, offset);
	cb(BlenoCharacteristic.RESULT_SUCCESS, this.beaconConfig.uri);
};

EddystoneConfigService.prototype._writeFlags = function (data, offset, withoutResponse, cb) {
	this.beaconConfig.flags = new Buffer(data);
	this.emit('flags', 'write', this.beaconConfig.flags, data);
	cb(BlenoCharacteristic.RESULT_SUCCESS);
};

EddystoneConfigService.prototype._readFlags = function (offset, cb) {
	this.emit('flags', 'read', this.beaconConfig.flags, offset);
	cb(BlenoCharacteristic.RESULT_SUCCESS, this.beaconConfig.flags);
};

EddystoneConfigService.prototype._writeTxPowerLevel = function (data, offset, withoutResponse, cb) {
	this.beaconConfig.txPowerLevel = new Buffer(data);
	this.emit('txPowerLevel', 'write', this.beaconConfig.txPowerLevel, data);
	cb(BlenoCharacteristic.RESULT_SUCCESS);
};

EddystoneConfigService.prototype._readTxPowerLevel = function (offset, cb) {
	this.emit('txPowerLevel', 'read', this.beaconConfig.txPowerLevel, offset);
	cb(BlenoCharacteristic.RESULT_SUCCESS, this.beaconConfig.txPowerLevel);
};

EddystoneConfigService.prototype._writeTxPowerMode = function (data, offset, withoutResponse, cb) {
	this.beaconConfig.txPowerMode = new Buffer(data);
	this.emit('txPowerMode', 'write', this.beaconConfig.txPowerMode, data);
	cb(BlenoCharacteristic.RESULT_SUCCESS);
};

EddystoneConfigService.prototype._readTxPowerMode = function (offset, cb) {
	this.emit('txPowerMode', 'read', this.beaconConfig.txPowerMode, offset);
	cb(BlenoCharacteristic.RESULT_SUCCESS, this.beaconConfig.txPowerMode);
};

EddystoneConfigService.prototype._writeBeaconPeriod = function (data, offset, withoutResponse, cb) {
	var period = data.readUInt16LE(0);

	if (period >= BEACON_PERIOD_LOWEST) {
		this.beaconConfig.beaconPeriod = data;
		this.beaconConfig.disabled = false;
	} else if (period === 0) {
		this.beaconConfig.disabled = true;
	} else {
		this.beaconConfig.disabled = false;
	}

	this.emit('beaconPeriod', 'write', this.beaconConfig.beaconPeriod, data);
	cb(BlenoCharacteristic.RESULT_SUCCESS);
};

EddystoneConfigService.prototype._readBeaconPeriod = function (offset, cb) {
	var data;

	if (this.beaconConfig.disabled) {
		data = new Buffer(2);
		data.fill(0);
	} else {
	 	data = new Buffer(this.beaconConfig.beaconPeriod);
	}

	this.emit('txPowerMode', 'read', this.beaconConfig.beaconPeriod, offset);
	cb(BlenoCharacteristic.RESULT_SUCCESS, data);
};

EddystoneConfigService.prototype._reset = function (data, offset, withoutResponse, cb) {
	console.log('reset', data);
	this.emit('reset', 'write', data, offset);
	cb(BlenoCharacteristic.RESULT_SUCCESS);
};

EddystoneConfigService.prototype._generateCharacteristics = function() {
	var chs = this.characteristics;
	return Object.keys(chs).map(function (ch) {
		var Characteristic = function() {
			Characteristic.super_.call(this, chs[ch]);
		};

		util.inherits(Characteristic, BlenoCharacteristic);
		return new Characteristic();
	});
};

EddystoneConfigService.prototype.advertise = function() {
	var _this = this;

	function start() {
		if (bleno.state === 'poweredOn') {
			bleno.startAdvertising(_this.beaconConfig.name, ['ee0c2080-8786-40ba-ab96-99b91ac981d8']);
		} else {
			bleno.once('stateChange', function() {
				start();
			});
		}
	}

	// After advertising is started, set up config services
	bleno.once('advertisingStart', function(err) {
		if (err) {
			_this.emit('advertisingStart', err);
			return;
		}

    bleno.setServices([
      new BlenoPrimaryService({
        uuid: 'ee0c2080-8786-40ba-ab96-99b91ac981d8',
        characteristics: _this._generateCharacteristics()
      })
    ]);
	});

	start();
};

EddystoneConfigService.prototype.setConfig = function(opts) {
	this.beaconConfig = objectAssign(this.beaconConfig, opts);
};

// Exports result code for convenience
EddystoneConfigService.RESULT_SUCCESS = BlenoCharacteristic.RESULT_SUCCESS;
EddystoneConfigService.RESULT_INVALID_OFFSET = BlenoCharacteristic.RESULT_INVALID_OFFSET;
EddystoneConfigService.RESULT_INVALID_ATTRIBUTE_LENGTH = BlenoCharacteristic.RESULT_INVALID_ATTRIBUTE_LENGTH;
EddystoneConfigService.RESULT_UNLIKELY_ERROR = BlenoCharacteristic.RESULT_UNLIKELY_ERROR;

module.exports = new EddystoneConfigService();
