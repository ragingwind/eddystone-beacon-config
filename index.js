'use strict';

var util = require('util');
var debug = require('debug')('eddystone:config');
var bleno = require('bleno');
var objectAssign = require('object-assign');
var PrimaryService = bleno.PrimaryService;
var EventEmitter = require('events').EventEmitter;
var Characteristics = require('./eddystone-characteristics');

function EddystoneConfigService() {
	var self = this;

	// set to initialize value
	self.configs = {};

	// create beacon primaty service with characteristics
	self.service = new PrimaryService({
		uuid: 'ee0c2080-8786-40ba-ab96-99b91ac981d8',
		characteristics: Characteristics.generate(self)
	});

	// bind lock event
	self.on('lock', function(req, res) {
		res(self.configs.lockState);
	});

	// bind read events
	self.on('read', function(req, res) {
		var value = (req.name === 'beaconPeriod' && this.disabled) ? 0x0000 : this.configs[req.name];
		res(value);

		debug('read:%s, response with: %s', req.name, value);
	});

	// bind write events
	self.on('write', function(req) {
		var updated = true;

		if (req.name === 'beaconPeriod') {
			updated = this.updateBeaconPeriod(req.value);
		} else {
			this.configs[req.name] = req.value;
		}

		if (updated) {
			this.emit('update', {
				name: req.name,
				value: req.value
			});

			debug('write:%s, value has been updated with: %s', req.name, req.value);
		}
	});
}

util.inherits(EddystoneConfigService, EventEmitter);

EddystoneConfigService.prototype.updateBeaconPeriod = function (period) {
	var disable = this.disabled;
	var updated = false;

	if (period === 0) {
		disable = true;
	} else {
		if (period >= this.opts.periodLowest) {
			this.configs.beaconPeriod = period;
			updated = true;
		}
		disable = false;
	}

	if (this.disabled !== disable) {
		this.disabled = disable;
		this.emit('disable', {
			disabled: this.disabled
		});
	}

	return updated;
};

EddystoneConfigService.prototype.configure = function(configs) {
	this.configs = objectAssign(this.configs, configs);

	['name', 'uri', 'flags', 'txPowerMode', 'txPowerLevel', 'beaconPeriod'].forEach(function (prop) {
		if (this.configs[prop] === undefined) {
			throw new Error('Configs has invalid value of ', prop);
		}
	}.bind(this));

	debug('configuration has been updated: ');
	debug('  name: %s', this.configs.name);
	debug('  uri: %s', this.configs.uri);
	debug('  txPower mode: %d, level: %s', this.configs.txPowerMode, this.configs.txPowerLevel);
	debug('  beaconPeriod: %d', this.configs.beaconPeriod);

	return this.configs;
};

EddystoneConfigService.prototype.lock = function() {
	this.configs.lockState = true;
};

EddystoneConfigService.prototype.unlock = function() {
	this.configs.lockState = false;
};

EddystoneConfigService.prototype.advertise = function(configs, opts) {
	var self = this;

	// update configuration and options
	self.configure(configs);
	self.opts = opts;

	function start() {
		if (bleno.state === 'poweredOn') {
			bleno.startAdvertising(self.configs.name, ['ee0c2080-8786-40ba-ab96-99b91ac981d8']);
		} else {
			bleno.once('stateChange', function() {
				start();
			});
		}
	}

	// after advertising is started successful, set up config services
	bleno.once('advertisingStart', function(err) {
		debug('advertising has been started with %s', err ? err : 'no error');
		if (!err) {
	    bleno.setServices([self.service]);
		}
	});

	start();
};

module.exports = new EddystoneConfigService();
