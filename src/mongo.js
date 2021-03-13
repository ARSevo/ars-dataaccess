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

const createConnection = async (mongodbConnection, name, options = null) => {
	mongoose.Promise = require('bluebird');
	const dbOptions = options || defaultConnectionOptions;
	dbOptions.dbName = name;
	const connection = await mongoose.createConnection(mongodbConnection, dbOptions);
	return isConnected(connection.readyState);
};

const removeConnection = async name => {
	const connection = mongoose.connections.find(t => t.name === name && t.readyState === mongoConnectionState.connected);
	await connection.close();
};

const createDatabase = async (mongodbConnection, dbName, testCollection = '_tc_', options = null) => {
	const dbOptions = options || defaultConnectionOptions;
	dbOptions.dbName = dbName;
	const connection = await mongoose.createConnection(mongodbConnection, dbOptions);
	await connection.createCollection(testCollection);
	await connection.close();
};

const dropDatabase = async (mongodbConnection, dbName, options = null) => {
	const dbOptions = options || defaultConnectionOptions;
	dbOptions.dbName = dbName;
	const connection = await mongoose.createConnection(mongodbConnection, dbOptions);
	await connection.dropDatabase();
	await connection.close();
};

const stats = async connection => {
	return await connection.db.stats({ scale: 1024 });
};

const { save, remove, fetch, fetchById, paginate, model, copyTo } = require('./mongohelper');

module.exports = {
	connect,
	mongoConnections: mongoose.connections,
	createConnection,
	removeConnection,
	createDatabase,
	dropDatabase,
	stats,
	save,
	remove,
	fetch,
	fetchById,
	paginate,
	copyTo,
	model: model(mongoose),
	multiConnectionModel: connection => model(connection),
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