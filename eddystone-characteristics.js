'use strict';

var util = require('util');
var Characteristic = require('bleno').Characteristic;
var Results = Characteristic;
var encoding = require('eddystone-url-encoding');
var objectAssign = require('object-assign');

Results.RESULT_WRITE_NOTE_PERMITTED = 0x03;

var TX_POWER_MODE_HIGH = 3;
var TX_POWER_MODE_MEDIUM = 2;
var TX_POWER_MODE_LOW = 1;
var TX_POWER_MODE_LOWEST = 0;

function byte2buf(sizeof) {
	var method = ['writeUInt8', 'writeUInt16LE', null, 'writeUInt32LE'][sizeof - 1];
	return function(byte) {
		var buf = new Buffer(sizeof);
		buf[method](byte, 0);
		return buf;
	};
}

function buf2byte(sizeof) {
	var method = ['readUInt8', 'readUInt16LE', null, 'readUInt32LE'][sizeof - 1];
	return function(buf) {
		return buf[method](0);
	};
}

function arr2buf(arr) {
	var buf = new Buffer(arr.length);
	for (var i = 0; i < arr.length; ++i) {
		buf.writeUInt8(arr[i], i, true);
	}
	return buf;
}

function buf2arr(buf) {
	var arr = [];
	for (var i = 0; i < buf.length; ++i) {
		arr.push(buf.readUInt8(i));
	}
	return arr;
}

function EddystoneCharacteristic(opts) {
	EddystoneCharacteristic.super_.call(this, opts);

	if (!opts.name || !opts.service) {
		throw new Error('Invalid name and service for characteristic');
	}

	this.name = opts.name;
	this.service = opts.service;
}

util.inherits(EddystoneCharacteristic, Characteristic);

EddystoneCharacteristic.prototype.onWriteRequest = function (data, offset, withoutResponse, cb) {
	var self = this;
	var req = {
		name: self.name,
		data: data,
		offset: offset,
		value: null
	};

	self.service.emit('lock', req, function(lockState) {
		if (lockState) {
			cb(Results.RESULT_UNLIKELY_ERROR);
		} else if (data.length === 0 || data.length >= 13) {
			cb(Results.RESULT_INVALID_ATTRIBUTE_LENGTH);
		} else {
			self.emit('beforeWrite', data, function(err) {
				if (err) {
					cb(err);
					return;
				}

				req.value = self.fromBuffer(data, offset);
				self.service.emit('write', req);

				cb(Results.RESULT_SUCCESS);
			});
		}
	});
};

EddystoneCharacteristic.prototype.onReadRequest = function (offset, cb) {
	var self = this;
	var req = {
		name: self.name,
		offset: offset,
		value: null
	};

	self.service.emit('lock', req, function(lockState) {
		self.service.emit('read', req, function (data) {
			cb(Results.RESULT_SUCCESS, self.toBuffer(data));
		});
	});
};

function LockStateCharateristic(opts) {
	LockStateCharateristic.super_.call(this, objectAssign({
		uuid: 'ee0c2081-8786-40ba-ab96-99b91ac981d8',
		properties: ['read'],
	}, opts));

	this.on('beforeWrite', function(data, res) {
		res(data.length == 1 ? Results.RESULT_SUCCESS : Results.RESULT_INVALID_ATTRIBUTE_LENGTH);
	});

	this.toBuffer = byte2buf(1);
	this.fromBuffer = buf2byte(1);
}

util.inherits(LockStateCharateristic, EddystoneCharacteristic);

function LockCharateristic(opts) {
	LockCharateristic.super_.call(this, objectAssign({
		uuid: 'ee0c2082-8786-40ba-ab96-99b91ac981d8',
		properties: ['read'],
	}, opts));
}

util.inherits(LockCharateristic, EddystoneCharacteristic);

function UnlockCharateristic(opts) {
	UnlockCharateristic.super_.call(this, objectAssign({
		uuid: 'ee0c2083-8786-40ba-ab96-99b91ac981d8',
		properties: ['writeWithoutResponse'],
	}, opts));
}

util.inherits(UnlockCharateristic, EddystoneCharacteristic);

function UriDataCharateristic(opts) {
	UriDataCharateristic.super_.call(this, objectAssign({
		uuid: 'ee0c2084-8786-40ba-ab96-99b91ac981d8',
		properties: ['read', 'write']
	}, opts));

	this.on('beforeWrite', function(data, res) {
		res(Results.RESULT_SUCCESS);
	});

	this.toBuffer = encoding.encode;
	this.fromBuffer = encoding.decode;
}

util.inherits(UriDataCharateristic, EddystoneCharacteristic);

function FlagsCharateristic(opts) {
	FlagsCharateristic.super_.call(this, objectAssign({
		uuid: 'ee0c2085-8786-40ba-ab96-99b91ac981d8',
		properties: ['read', 'write']
	}, opts));

	this.on('beforeWrite', function(data, res) {
		res(data.length == 1 ? Results.RESULT_SUCCESS : Results.RESULT_INVALID_ATTRIBUTE_LENGTH);
	});

	this.toBuffer = byte2buf(1);
	this.fromBuffer = buf2byte(1);
}

util.inherits(FlagsCharateristic, EddystoneCharacteristic);

function TxPowerLevelCharateristic(opts) {
	TxPowerLevelCharateristic.super_.call(this, objectAssign({
		uuid: 'ee0c2084-8786-40ba-ab96-99b91ac981d8',
		properties: ['read', 'write']
	}, opts));

	this.on('beforeWrite', function(data, res) {
		res(data.length == 4 ? Results.RESULT_SUCCESS : Results.RESULT_INVALID_ATTRIBUTE_LENGTH);
	});

	this.toBuffer = arr2buf;
	this.fromBuffer = buf2arr;
}

util.inherits(TxPowerLevelCharateristic, EddystoneCharacteristic);

function TxPowerModeCharateristic(opts) {
	TxPowerModeCharateristic.super_.call(this, objectAssign({
		uuid: 'ee0c2087-8786-40ba-ab96-99b91ac981d8',
		properties: ['read', 'write']
	}, opts));

	this.on('beforeWrite', function(data, res) {
		var err = Results.RESULT_SUCCESS;
		var value = this.fromBuffer(data);
		if (data.length !== 1) {
			err = Results.RESULT_INVALID_ATTRIBUTE_LENGTH;
		} else if (value < TX_POWER_MODE_LOWEST || value > TX_POWER_MODE_HIGH) {
			err = Results.RESULT_WRITE_NOTE_PERMITTED;
		}

		res(err);
	});

	this.toBuffer = byte2buf(1);
	this.fromBuffer = buf2byte(1);
}

util.inherits(TxPowerModeCharateristic, EddystoneCharacteristic);

function BeaconPeriodCharateristic(opts) {
	BeaconPeriodCharateristic.super_.call(this, objectAssign({
		uuid: 'ee0c2088-8786-40ba-ab96-99b91ac981d8',
		properties: ['read', 'write']
	}, opts));

	this.on('beforeWrite', function(data, res) {
		res(data.length == 2 ? Results.RESULT_SUCCESS : Results.RESULT_INVALID_ATTRIBUTE_LENGTH);
	});

	this.toBuffer = byte2buf(2);
	this.fromBuffer = buf2byte(2);
}

util.inherits(BeaconPeriodCharateristic, EddystoneCharacteristic);

function ResetCharateristic(opts) {
	ResetCharateristic.super_.call(this, objectAssign({
		uuid: 'ee0c2089-8786-40ba-ab96-99b91ac981d8',
		properties: ['writeWithoutResponse']
	}, opts));

	this.on('beforeWrite', function(data, res) {
		res(data.length == 1 ? Results.RESULT_SUCCESS : Results.RESULT_INVALID_ATTRIBUTE_LENGTH);
	});

	this.toBuffer = byte2buf(1);
	this.fromBuffer = buf2byte(1);
}

util.inherits(ResetCharateristic, EddystoneCharacteristic);

module.exports = {
	generate: function(service) {
		return [
			{
				name: 'lockState',
				handler: LockStateCharateristic
			},
			{
				name: 'lock',
				handler: LockCharateristic
			},
			{
				name: 'unlock',
				handler: UnlockCharateristic
			},
			{
				name: 'uriData',
				handler: UriDataCharateristic
			},
			{
				name: 'flags',
				handler: FlagsCharateristic
			},
			{
				name: 'txPowerLevel',
				handler: TxPowerLevelCharateristic
			},
			{
				name: 'txPowerMode',
				handler: TxPowerModeCharateristic
			},
			{
				name: 'beaconPeriod',
				handler: BeaconPeriodCharateristic
			},
			{
				name: 'reset',
				handler: ResetCharateristic
			}
		].map(function(char) {
			return new char.handler({service: service, name: char.name});
		});
	}
};
