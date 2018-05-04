
'use strict';
const sql = require('mssql');
const MAXWAITTIMETOCONNECT = 10000; // Give max 10secs for sql server to open a connection pool

const connect = async pool => {
	if (!pool.connected && !pool.connecting) {
		await pool.connect(err => err ? console.log(err) : console.log('Connected to SQL'));
	}
	return new Promise((resolve, reject) => {
		let trialCount = 0;
		const testConnectionTimer = setInterval(() => {
			trialCount++;
			if(pool.connected){
				clearInterval(testConnectionTimer);
				resolve(pool.connected);
			} 
			if(trialCount > MAXWAITTIMETOCONNECT / 100) {
				clearInterval(testConnectionTimer);
				reject('Sql server did not respond connection request for 10 secs');
			}
		}, 100);
	});
};
/**
 * Parameters needed to connect mssql server
 */
class ConnectionParams {
	/**
	 * @param {string} user Username to connect mssql server
	 * @param {string} password Password to connect mssql server
	 * @param {string} server Mssql server host endpoint
	 * @param {string} database Database name on mssql server
	 */
	constructor(user, password, server, database) {
		this.user = user;
		this.password = password;
		this.server = server;
		this.database = database;
	}
}

let pool = null;
/**
 * Initialize and configure the mssql server connection pool 
 * @param {ConnectionParams} connectionParams 
 */
const init = connectionParams => {
	if (pool) {
		return;
	}
	const poolOptions = Object.assign({
		options: {
			encrypt: true
		}, pool: {
			min: 1,
			max: 5,
			autostart: true,
			idleTimeoutMillis: 30000
		}
	}, connectionParams);
	pool = new sql.ConnectionPool(poolOptions);
	//pool.on('error', err => console.log(err));
};


module.exports = {
	sql: sql,
	pool: pool,
	ConnectionParams: ConnectionParams,
	request: new sql.Request(pool),
	connect: async connectionParams => {
		init(connectionParams);
		return await connect(pool);
	},
	isConnected : () => pool.connected,
	disconnect: async () => {
		if (!pool) {
			return;
		}
		pool.close();
	}
};