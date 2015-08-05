'use strict';

var beaconConfigService = require('../');

// Change lock state to false
beaconConfigService.unlock();

beaconConfigService.on('uri', function (e) {
	console.log('URI has been updated from %s to %s', e.prevValue, e.newValue);
});

beaconConfigService.on('flags', function (e) {
	console.log('Flags has been updated from %s to %s', e.prevValue, e.newValue);
});

beaconConfigService.on('txpower-level', function (e) {
	console.log('TX Power level has been updated from %s to %s', e.prevValue, e.newValue);
});

beaconConfigService.on('txpower-mode', function (e) {
	console.log('TX Power mode has been updated from %s to %s', e.prevValue, e.newValue);
});

beaconConfigService.on('beacon-period', function (e) {
	console.log('Beacone period has been updated from %s to %s', e.prevValue, e.newValue);
});

beaconConfigService.on('reset', function (e) {
	console.log('Beacon should do reset');
});

console.log('Eddystone beacon configuration service has been started');
beaconConfigService.advertise();
