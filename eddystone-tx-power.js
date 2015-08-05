'use strict';

var TX_POWER_MODE_HIGH = 3;
var TX_POWER_MODE_MEDIUM = 2;
var TX_POWER_MODE_LOW = 1;
var TX_POWER_MODE_LOWEST = 0;

function buf2arr(levels) {
	return [
		levels.readUInt8(0),
		levels.readUInt8(1),
		levels.readUInt8(2),
		levels.readUInt8(3),
	];
}

function arr2buf(levels) {
	var buf = new Buffer(4);

	buf.writeUInt8(levels[0], 0, true);
	buf.writeUInt8(levels[1], 1, true);
	buf.writeUInt8(levels[2], 2, true);
	buf.writeUInt8(levels[3], 3, true);

	return buf;
}

function EddystoneTxPower(levels, mode) {
	this.levels(levels || [-100, -30, 0, 20]);
	this.mode(mode ? mode : TX_POWER_MODE_LOW);
}

EddystoneTxPower.prototype._set = function (mode, level, noCheck) {
	if (level > 20 || level < -100) {
		throw new Error('Tx power level is invalid', level);
	}

	var low = this._levels[mode - 1] || -101;
	var high = this._levels[mode + 1] || 21;

	if (!noCheck || (level > low && level < high)) {
		this._levels[mode] = level;
	}

	return this._levels[mode];
};

EddystoneTxPower.prototype.high = function (level) {
	return this._set(TX_POWER_MODE_HIGH, level);
};

EddystoneTxPower.prototype.medium = function (level) {
	return this._set(TX_POWER_MODE_MEDIUM, level);
};

EddystoneTxPower.prototype.low = function (level) {
	return this._set(TX_POWER_MODE_LOW, level);
};

EddystoneTxPower.prototype.lowest = function (level) {
	return this._set(TX_POWER_MODE_LOWEST, level);
};

EddystoneTxPower.prototype.levels = function (levels) {
	this._levels = this._levels || [];

	if (levels) {
		if (levels instanceof Buffer) {
			levels = buf2arr(levels);
		}

		levels.forEach(function(level, idx) {
			this._set(idx, level, false);
		}.bind(this));
	}

	return this._levels;
};

EddystoneTxPower.prototype.level = function (mode) {
	return this._levels[this._mode];
};

EddystoneTxPower.prototype.mode = function (mode) {
	if (mode > TX_POWER_MODE_HIGH || mode < TX_POWER_MODE_LOWEST) {
		throw new Error('Eddystone Tx Power mode is invalid', mode);
	}

	if (mode) {
		this._mode = mode;
	}

	return this._mode;
};

EddystoneTxPower.prototype.toBuffer = function () {
	return arr2buf(this._levels);
};

module.exports = EddystoneTxPower;
