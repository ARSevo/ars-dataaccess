'use strict';
const
	{
		sqlserverConnection,
		sqlServerDatabase,
		sqlserverUser,
		sqlserverPwd,
		environmentCheck
	} = require('../config');
const sql = require('mssql');

const connect = async pool => {
	if (!pool.connected && !pool.connecting) {
		await pool.connect(err => err ? console.log(err) : console.log('Connected to SQL'));
	}
	return pool.connected || pool.connecting ? true : false;
};

let pool = null;
const createPool = () => {
	if (pool) {
		return;
	}
	environmentCheck('sqlserverConnection');
	environmentCheck('sqlServerDatabase');
	environmentCheck('sqlserverUser');
	environmentCheck('sqlserverPwd');
	pool = new sql.ConnectionPool({
		user: sqlserverUser,
		password: sqlserverPwd,
		server: sqlserverConnection,
		database: sqlServerDatabase,
		options: {
			encrypt: true,
		},
		pool: {
			min: 1,
			max: 5,
			autostart: true,
			idleTimeoutMillis: 30000
		}
	});
	pool.on('error', err => console.log(err));
};


module.exports = {
	sql: sql,
	pool: pool,
	request: new sql.Request(pool),
	connect: async () => {
		createPool();
		return await connect(pool);
	},
	disconnect: async () => {
		if (!pool) {
			return;
		}
		return await pool.close();
	}
};