const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const mongoConnectionState = {
	disconnected: 0,
	connected: 1,
	connecting: 2,
	disconnecting: 3
};

const isConnected = state => state === mongoConnectionState.connected || state === mongoConnectionState.connecting;

const connect = async (mongodbConnection, options = null) => {
	if (!isConnected(mongoose.connection.readyState)) {
		mongoose.Promise = require('bluebird');
		await mongoose.connect(mongodbConnection, options || {
			socketTimeoutMS: 30000,
			connectTimeoutMS: 30000,
			keepAlive: 1000,
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
	}
	return isConnected(mongoose.connection.readyState);
};

const { save, remove, fetch, fetchById, paginate, model } = require('./mongohelper');

module.exports = {
	connect,
	save,
	remove,
	fetch,
	fetchById,
	paginate,
	model: model(mongoose),
	validateObjectId: function (id) {
		try {
			new mongoose.Types.ObjectId(id);
			return true;
		} catch (ex) {
			return false;
		}
	},
	Schema: mongoose.Schema,
	disconnect: async () => await mongoose.disconnect(),
	mongoConnectionState: mongoConnectionState
};