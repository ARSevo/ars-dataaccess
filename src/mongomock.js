/* eslint-disable */
const mongo = require('./mongo');
const { isArray } = require('util');
let data = [];
const connect = async mongodbConnection => {
};

const save = (mongoModel, modelConvertor, selector) => async entities => {
	isArray(entities) ? data.push(...entities) : data.push(entities);
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
	const fetchedData = data.map(d => {
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

	return fetchedData.length == 1 ? fetchedData[0] : fetchedData;
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