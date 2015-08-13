# eddystone-beacon-config
> Eddystone beacon configuration service for Node.js. The configuration service allows you can build up [Eddystone configuration service](https://github.com/google/eddystone/blob/master/eddystone-url/docs/config-service-spec.md) easily on Node.js with [bleno](https://github.com/sandeepmistry/bleno). This configuration service has passed the validation test of [Eddystone url config validator](https://github.com/google/eddystone/tree/master/eddystone-url/tools/eddystone-url-config-validator)

# WARNING

- It rather a bit experimental project to me. I'll keep working for a while so the project content might be changed a lot suddenly.
- The package has been tested on MacOS only

## Install

```
$ npm install --save eddystone-beacon-config
```


## Usage

```js
var defaults = {
	name: 'Eddystone-URL Configuration Service',
	uri: 'http://google.com',
	flags: 0, // set uri flags to 0
	txPowerMode: TX_POWER_MODE_LOW,
	txPowerLevel: TX_POWER_MODE_LEVELS,
	beaconPeriod: 1000 // beacon period to 1000 (1 second)
};

var beaconConfigService = require('eddystone-beacon-config');

// unlock if you want to accept to configure by new data
beaconConfigService.unlock();

// update event hander
beaconConfigService.on('update', function (e) {
	console.log('%s has been updated %s', e.name, e.value);

	// reset event handler, if you've got reset event with true
	if (e.name === 'reset' && e.value == 1) {
		console.log('have got reset request');
		configs = objectAssign(defaults);
		beaconConfigService.configure(configs);
	} else {
		configs[e.name] = e.value;
	}
});

// handling disable event
beaconConfigService.on('disable', function (e) {
	console.log('Have got zero-beacon-period to stop transmitting URL');
});

// start advertising
beaconConfigService.advertise(defaults, {
	beaconConfigService.advertise(configs, {
		periodLowest: BEACON_PERIOD_LOWEST
	});
});
```

## API

### advertise(configs, [options])

Start Eddystone configuration service advertising with configs and options

#### configs

Configurations for Eddystone configuration service. all of the properties come from [Eddystone configuration service spec document](https://goo.gl/8eLywE). excepts `name` for advertising

```
var defaults = {
	name: 'Eddystone-URL Configuration Service',
	uri: 'http://google.com',
	flags: 0, // set uri flags to 0
	txPowerMode: TX_POWER_MODE_LOW,
	txPowerLevel: TX_POWER_MODE_LEVELS,
	beaconPeriod: 1000 // beacon period to 1000 (1 second)
};
```

### unlock / lock

`unlock` allows beacon is able to during configuration mode. `lock` make beacon is not able to allow request for writing to update configs

### configure(configs)

to update configs in configuration service

#### options

Options for running configuration service.

- `periodLowest`: Lowest value for Beacon period. It wouldn't be updated if service gets the value lower than by the value.

## Events

### update

`update` event will being raised after receiving write request. the events come with two properties which are `name` and 'value'.

	- name: the name of the event, It should be a name of configurations. So You can access a value of configs if you are going to use same name in configs with the name of the `event`
	- value: the value of received

If the name of event is `reset`? the event is more special, which allows and forces you setting reset. the value should be `1`. but URI is optional. see more [information](https://github.com/google/eddystone/blob/master/eddystone-url/docs/config-service-spec.md#39-reset)

### disable

`disable` event will being raised if we've got A value of zero of period. It means that you disables Eddystone-URL transmissions. see more [information](https://github.com/google/eddystone/blob/master/eddystone-url/docs/config-service-spec.md#38-beacon-period)

## License

MIT © [Jimmy Moon](http://ragingwind.me)
