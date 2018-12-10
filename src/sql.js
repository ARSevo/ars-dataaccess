'use strict';
const sql = require('mssql');
const MAXWAITTIMETOCONNECT = 10000; // Give max 10secs for sql server to open a connection pool


/**
 * @param {string} user Username to connect mssql server
 * @param {string} password Password to connect mssql server
 * @param {string} server Mssql server host endpoint
 * @param {string} database Database name on mssql server
 */
const ConnectionParams = function (user, password, server, database) {
	return {
		user: user,
		password: password,
		server: server,
		database: database
	};
};

function initSQLPool(connectionParams) {
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
	return new sql.ConnectionPool(poolOptions);
}

const SQL = function () {
	return {
		pool: null,
		/**
		 * Connects the sql pool 
		 * @param {ConnectionParams} connectionParams 
		 */
		connect: async function (connectionParams) {
			if (!this.pool) {
				this.pool = initSQLPool(connectionParams);
			}
			if (!this.pool.connected && !this.pool.connecting) {
				await this.pool.connect(err => err ? console.log(err) : console.log('Connected to SQL'));
			}
			return new Promise((resolve, reject) => {
				let trialCount = 0;
				const testConnectionTimer = setInterval(() => {
					trialCount++;
					if (this.pool.connected) {
						clearInterval(testConnectionTimer);
						resolve(this.pool.connected);
					}
					if (trialCount > MAXWAITTIMETOCONNECT / 100) {
						clearInterval(testConnectionTimer);
						reject('Sql server did not respond connection request for 10 secs');
					}
				}, 100);
			});
		},
		sql: sql,
		ConnectionParams: ConnectionParams,
		request: function () {
			if (!this.pool) {
				throw new Error('SQL pool not initialized/connected');
			}
			return new sql.Request(this.pool);
		},
		isConnected: function () {
			return this.pool ? this.pool.connected : false;
		},
		disconnect: function () {
			if (!this.pool) {
				return;
			}
			this.pool.close();
		}
	};
};

module.exports = SQL();