'use strict';

var util = require('util');
var debug = require('debug')('es-config');
var bleno = require('bleno');
var objectAssign = require('object-assign');
var Characteristic = require('bleno').Characteristic;
var PrimaryService = bleno.PrimaryService;
var EventEmitter = require('events').EventEmitter;
var encoding = require('eddystone-url-encoding');
var TxPower = require('./eddystone-tx-power');

function EddystoneConfigService(config) {
	// set to initialize value
	this._config = {};
	this._resetConfig();

	// override config
	this.configure(objectAssign({
		name: 'Eddystone-URL Configuration Service',
		uri: 'http://google.com',
	}, config));

	debug('Configuration has been updated: ');
	debug('  name: %s', this._config.name);
	debug('  uri: %s', this._config.uri);
	debug('  txPower mode: %d, level: %d', this._config.txPower.mode(), this._config.txPower.level());
	debug('  beaconPeriod: %d', this._config.beaconPeriod);

	// build up beacon configure service characteristics
	var characteristics = {
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

	// create beacon primaty service with characteristics
	this.service = new PrimaryService({
		uuid: 'ee0c2080-8786-40ba-ab96-99b91ac981d8',
		characteristics: Object.keys(characteristics).map(function (ch) {
			return new Characteristic(characteristics[ch]);
		})
	});
}

util.inherits(EddystoneConfigService, EventEmitter);

function bool2buf(bool) {
	var buf = new Buffer(1);
	buf.fill(bool ? 1 : 0);
	return buf;
}

function byte2buf(byte, digit) {
	digit = digit || 1;

	var write = ['writeUInt8', 'writeUInt16LE'];
	var buf = new Buffer(digit);

	buf[write[digit - 1]](byte, 0, false);

	return buf;
}

EddystoneConfigService.prototype._emitWithValue = function (event, prevValue, newValue) {
	debug('emit event with values: %s prev: %s, new: %s', event, prevValue, newValue);

	this.emit(event, {prevValue: prevValue, newValue: newValue});
};

EddystoneConfigService.prototype._readLockState = function (offset, cb) {
	debug('reading lock state: %s', this._lockState);

	cb(Characteristic.RESULT_SUCCESS, bool2buf(this._lockState));
};

EddystoneConfigService.prototype._writeUriData = function (data, offset, withoutResponse, cb) {
	debug('writing uri, lock state: %s', this._lockState);

	var err = Characteristic.RESULT_UNLIKELY_ERROR;

	if (this._lockState === false) {
		var prev = this._config.uri;
		this._config.uri = encoding.decode(data);
		this._emitWithValue('uri', prev, this._config.uri);
		err = Characteristic.RESULT_SUCCESS;
	}

	cb(err);
};

EddystoneConfigService.prototype._readUriData = function (offset, cb) {
	debug('Reading URI: %s, lock state: %s', this._config.uri, this._lockState);

	cb(Characteristic.RESULT_SUCCESS, encoding.encode(this._config.uri));
};

EddystoneConfigService.prototype._writeFlags = function (data, offset, withoutResponse, cb) {
	debug('Writing flags, lock state: %s', this._lockState);

	var err = Characteristic.RESULT_UNLIKELY_ERROR;

	if (this._lockState === false) {
		var prev = this._config.flags;
		this._config.flags = data.readUInt8(offset);
		this._emitWithValue('flags', prev, this._config.flags);
		err = Characteristic.RESULT_SUCCESS;
	}

	cb(err);
};

EddystoneConfigService.prototype._readFlags = function (offset, cb) {
	debug('reading flags: %s, lock state: %s', this._config.flags, this._lockState);

	cb(Characteristic.RESULT_SUCCESS, byte2buf(this._config.flags));
};

EddystoneConfigService.prototype._writeTxPowerLevel = function (data, offset, withoutResponse, cb) {
	debug('writing tx power, lock state: %s', this._lockState);

	var err = Characteristic.RESULT_UNLIKELY_ERROR;

	if (this._lockState === false) {
		var prev = this._config.txPower.levels();
		this._config.txPower.levels(data);
		this._emitWithValue('txpower-level', prev, this._config.flags);
		err = Characteristic.RESULT_SUCCESS;
	}

	cb(err);
};

EddystoneConfigService.prototype._readTxPowerLevel = function (offset, cb) {
	debug('reading flags: %s, lock state: %s', this._config.txPower.levels(), this._lockState);

	cb(Characteristic.RESULT_SUCCESS, this._config.txPower.toBuffer());
};

EddystoneConfigService.prototype._writeTxPowerMode = function (data, offset, withoutResponse, cb) {
	debug('writing tx mode, lock state: %s', this._lockState);

	var err = Characteristic.RESULT_UNLIKELY_ERROR;

	if (this._lockState === false) {
		var prev = this._config.txPower.mode();
		this._config.txPower.mode(data.readUInt8(0));
		this._emitWithValue('txpower-mode', prev, this._config.flags);
		err = Characteristic.RESULT_SUCCESS;
	}

	cb(err);
};

EddystoneConfigService.prototype._readTxPowerMode = function (offset, cb) {
	debug('reading tx mode: %s, lock state: %s', this._config.txPower.mode(), this._lockState);

	cb(Characteristic.RESULT_SUCCESS, byte2buf(this._config.txPower.mode()));
};

EddystoneConfigService.prototype._writeBeaconPeriod = function (data, offset, withoutResponse, cb) {
	debug('writing becaon period, lock state: %s', this._lockState);

	var BEACON_PERIOD_LOWEST = 10;
	var err = Characteristic.RESULT_UNLIKELY_ERROR;

	if (this._lockState === false) {
		var period = data.readUInt16LE(0);

		if (period === 0) {
			this._emitWithValue('beacon-period', 0, 0);
			this._freezeBeacon = true;
		} else {
			var prev = this._config.beaconPeriod;
			this._config.beaconPeriod = period >= BEACON_PERIOD_LOWEST ? period : this._config.beaconPeriod;
			this._emitWithValue('beacon-period', prev, this._config.beaconPeriod);
			this._freezeBeacon = false;
		}

		err = Characteristic.RESULT_SUCCESS;
	}

	cb(err);
};

EddystoneConfigService.prototype._readBeaconPeriod = function (offset, cb) {
	debug('reading becaon period: %d, freeze: %d, lock state: %s',
				this._config.beaconPeriod,
				this._freezeBeacon,
				this._lockState);

	cb(Characteristic.RESULT_SUCCESS, byte2buf(this._freezeBeacon ? 0x0000 : this._config.beaconPeriod, 2));
};


EddystoneConfigService.prototype._reset = function (data, offset, withoutResponse, cb) {
	var err = Characteristic.RESULT_UNLIKELY_ERROR;

	if (this._lockState === false) {
		this._resetConfig();
		err = Characteristic.RESULT_SUCCESS;
	}

	// reset freezing status manually
	this._freezeBeacon = false;

	cb(err);
};

EddystoneConfigService.prototype._resetConfig = function () {
	// reset beacon config
	this._config = objectAssign(this._config, {
		flags: 0, // set uri flags to 0
		txPower: new TxPower(), // set tx power mode to low
		beaconPeriod: 1000 // beacon period to 1000 (1 second)
	});
};

EddystoneConfigService.prototype.configure = function(config) {
	this._config = objectAssign(this._config, config);

	['name', 'uri', 'txPower', 'flags', 'beaconPeriod'].forEach(function (prop) {
		if (this._config[prop] === undefined) {
			throw new Error('Configs has invalid value of ', prop);
		}
	}.bind(this));

	return this._config;
};

EddystoneConfigService.prototype.lock = function() {
	this._lockState = true;
};

EddystoneConfigService.prototype.unlock = function() {
	this._lockState = false;
};

EddystoneConfigService.prototype.advertise = function() {
	var self = this;

	function start() {
		if (bleno.state === 'poweredOn') {
			bleno.startAdvertising(self._config.name, ['ee0c2080-8786-40ba-ab96-99b91ac981d8']);
		} else {
			bleno.once('stateChange', function() {
				start();
			});
		}
	}

	// after advertising is started successful, set up config services
	bleno.once('advertisingStart', function(err) {
		if (!err) {
	    bleno.setServices([self.service]);
		}
	});

	start();
};

module.exports = new EddystoneConfigService();
