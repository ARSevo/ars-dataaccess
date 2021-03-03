const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const { updateIfCurrentPlugin } = require('mongoose-update-if-current');

const mongoConnectionState = {
	disconnected: 0,
	connected: 1,
	connecting: 2,
	disconnecting: 3
};

mongoose.plugin(updateIfCurrentPlugin, { strategy: 'timestamp' });

const isConnected = state => state === mongoConnectionState.connected || state === mongoConnectionState.connecting;

const defaultConnectionOptions = {
	socketTimeoutMS: 30000,
	connectTimeoutMS: 30000,
	keepAlive: 1000,
	useNewUrlParser: true,
	useUnifiedTopology: true
};

const connect = async (mongodbConnection, options = null) => {
	if (!isConnected(mongoose.connection.readyState)) {
		mongoose.Promise = require('bluebird');
		await mongoose.connect(mongodbConnection, options || defaultConnectionOptions);
	}
	return isConnected(mongoose.connection.readyState);
};

const mongoConnections = [];

const createConnection = async (mongodbConnection, name, options = null) => {
	mongoose.Promise = require('bluebird');
	const namedConnection = mongoConnections.find(t => t.name === name);
	if (namedConnection) {
		return isConnected(namedConnection.readyState);
	}
	const connection = await mongoose.createConnection(mongodbConnection, options || defaultConnectionOptions);
	mongoConnections.push({ name, connection });
	return isConnected(connection.readyState);
};

const stats = async () => {
	return await mongoose.connection.db.stats({ scale: 1024 });
};

const { save, remove, fetch, fetchById, paginate, model, copyTo } = require('./mongohelper');

module.exports = {
	connect,
	mongoConnections,
	createConnection,
	stats,
	save,
	remove,
	fetch,
	fetchById,
	paginate,
	copyTo,
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