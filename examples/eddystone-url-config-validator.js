'use strict';

var beaconConfigService = require('../');
// var beaconConfigService2 = require('../index2.js');

beaconConfigService.on('lockState', function (mode, res, req) {
	console.log('lockState', mode, res, req);
});

beaconConfigService.on('uriData', function (mode, res, req) {
	console.log('uriData', mode, res, req);
});

beaconConfigService.on('flags', function (mode, res, req) {
	console.log('flags', mode, res, req);
});

beaconConfigService.on('txPowerLevel', function (mode, res, req) {
	console.log('txPowerLevel', mode, res, req);
});

beaconConfigService.on('txPowerLevel', function (mode, res, req) {
	console.log('txPowerLevel', mode, res, req);
});

beaconConfigService.on('txPowerMode', function (mode, res, req) {
	console.log('txPowerMode', mode, res, req);
});

beaconConfigService.on('txPowerMode', function (mode, res, req) {
	console.log('txPowerMode', mode, res, req);
});

beaconConfigService.on('beaconPeriod', function (mode, res, req) {
	console.log('beaconPeriod', mode, res, req);
});

beaconConfigService.on('reset', function (mode, res, req) {
	console.log('reset', mode, res, req);
});

console.log('Eddystone beacon configuration servise has been started');
beaconConfigService.advertise();
