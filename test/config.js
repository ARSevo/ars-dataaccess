const envCheck = (name, message) => {
	if(!process.env[name]) {
		throw new Error(message || `process.env.${name} should be defined.`);
	}
	return process.env[name];
};

module.exports = {
	mongodbConnection: process.env.mongodbConnection,
	sqlserverConnection: process.env.sqlserverConnection,
	sqlserverUser: process.env.sqlserverUser,
	sqlserverPwd: process.env.sqlserverPwd,
	sqlServerDatabase: process.env.sqlServerDatabase,
	environmentCheck: envCheck
};