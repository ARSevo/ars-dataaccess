/* eslint-disable */
const mongo = require('./mongo');
let data = [];
const connect = async mongodbConnection => {
};

const save = (mongoModel, modelConvertor, selector) => async entities => {
	data.push(...entities);
	return entities;
};

const remove = mongoModel => async query => {
	const initialLength = data.length;
	data = data.map(d => {
		let allPropMatch = true;
		for (const key in query) {
			if (query.hasOwnProperty(key)) {
				const element = query[key];
				if (d[key] != element) {
					allPropMatch = false;
				}
			}
		}
		if (!allPropMatch) {
			return d;
		}
	});

	data = data.filter(t => t !== undefined);

	return data.length < initialLength;
};

const fetch = (mongoModel, domainConvertor) => async query => {
	return data.map(d => {
		for (const key in query) {
			if (query.hasOwnProperty(key)) {
				const element = query[key];
				if (d[key] != element) {
					return undefined;
				}
			}
		}
		return d;
	}).filter(t => t !== undefined);
};

module.exports = {
	connect: connect,
	model: mongo.model,
	save: save,
	remove: remove,
	fetch: fetch,
	Schema: mongo.Schema,
	mongoConnectionState: mongo.mongoConnectionState,
	disconnect: async () => { }
};