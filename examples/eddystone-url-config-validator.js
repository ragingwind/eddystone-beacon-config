'use strict';

var objectAssign = require('object-assign');
var beaconConfigService = require('../');

var TX_POWER_MODE_LOW = 1;
var TX_POWER_MODE_LEVELS = [-100, -30, 0, 20];
var BEACON_PERIOD_LOWEST = 10;

var defaults = {
	name: 'Eddystone-URL Configuration Service',
	uri: 'http://google.com',
	flags: 0, // set uri flags to 0
	txPowerMode: TX_POWER_MODE_LOW,
	txPowerLevel: TX_POWER_MODE_LEVELS,
	beaconPeriod: 1000 // beacon period to 1000 (1 second)
};

var configs = objectAssign(defaults);

beaconConfigService.on('update', function (e) {
	console.log('%s has been updated %s', e.name, e.value);

	if (e.name === 'reset' && e.value == 1) {
		console.log('have got reset request');
		configs = objectAssign(defaults);
		beaconConfigService.configure(configs);
	} else {
		configs[e.name] = e.value;
	}
});

beaconConfigService.on('disable', function (e) {
	console.log('Have got zero-beacon-period to stop transmitting URL');
});

// Change lock state to false
beaconConfigService.unlock();

// Starter advertising for configuration
console.log('Eddystone beacon configuration service is starting');
beaconConfigService.advertise(configs, {
	periodLowest: BEACON_PERIOD_LOWEST
});
