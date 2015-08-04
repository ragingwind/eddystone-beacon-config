'use strict';

var beaconConfigService = require('../');
var beaconConfig = {
	name: 'Eddystone-URL Configuration Service',
	lockState: false,
	uri: 'http://google.com',
	flags: 0,
	txPowerLevel: 0,
	txPowerMode: 0,
	beaconPeriod: 0,
	disabled: true
};

beaconConfigService.on('lockState', function (req, res) {
	res(beaconConfigService.RESULT_SUCCESS, beaconConfig);
	console.log('Reponse current lockstate: ', beaconConfig.lockState);
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
