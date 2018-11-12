const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const mongoConnectionState = {
	disconnected: 0,
	connected: 1,
	connecting: 2,
	disconnecting: 3
};

const isConnected = state => state === mongoConnectionState.connected || state === mongoConnectionState.connecting;

const connect = async mongodbConnection => {
	if (!isConnected(mongoose.connection.readyState)) {
		mongoose.Promise = require('bluebird');
		await mongoose.connect(mongodbConnection, {
			socketTimeoutMS: 30000,
			connectTimeoutMS: 30000,
			keepAlive: 1000,
			useNewUrlParser: true
		});
		return isConnected(mongoose.connection.readyState);
	}
};

const { save, remove, fetch, model } = require('./mongohelper');

module.exports = {
	connect: connect,
	save: save,
	remove: remove,
	fetch: fetch,
	model: model(mongoose),
	Schema: mongoose.Schema,
	disconnect: async () => await mongoose.disconnect(),
	mongoConnectionState: mongoConnectionState
};