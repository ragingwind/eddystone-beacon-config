'use strict';

var util = require('util');
var Characteristic = require('bleno').Characteristic;
var Results = Characteristic;
var encoding = require('eddystone-url-encoding');

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

function EddystoneConfigCharacteristic(opts) {
	opts = opts || {};

	EddystoneConfigCharacteristic.super_.call(this, opts);

	if (!opts.name || !opts.service) {
		throw new Error('Invalid name and service for characteristic');
	}

	this.name = opts.name;
	this.service = opts.service;

	if (opts.sizeof) {
		this.toBuffer = byte2buf(opts.sizeof);
		this.fromBuffer = buf2byte(opts.sizeof);
	} else if (opts.typeof === 'array') {
		this.toBuffer = arr2buf;
		this.fromBuffer = buf2arr;
	} else if (opts.typeof === 'uri') {
		this.toBuffer = encoding.encode;
		this.fromBuffer = encoding.decode;
	}

	if (!this.toBuffer || !this.fromBuffer) {
		throw new Error('Invalid characteristic typeof');
	}
}

util.inherits(EddystoneConfigCharacteristic, Characteristic);

EddystoneConfigCharacteristic.prototype.onWriteRequest = function (data, offset, withoutResponse, cb) {
	var self = this;
	var req = {
		name: self.name,
		data: data,
		offset: offset,
		value: null
	};

	self.service.emit('lock', req, function(lockState) {
		var err = !lockState ? Results.RESULT_SUCCESS : Results.RESULT_UNLIKELY_ERROR;

		if (!lockState) {
			req.value = self.fromBuffer(data, offset);
			self.service.emit('write', req);
		}
		cb(err);
	});
};

EddystoneConfigCharacteristic.prototype.onReadRequest = function (offset, cb) {
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


module.exports = EddystoneConfigCharacteristic;
