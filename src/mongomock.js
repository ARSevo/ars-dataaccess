/* eslint-disable */
const mongo = require('./mongo');
const { isString } = require('util');
let database = {};
const connect = async mongodbConnection => {
	return isString(mongodbConnection);
};

const save = (mongoModel, modelConvertor, selector) => async entities => {
	database[mongoModel.collection.name] = [];
	let data = database[mongoModel.collection.name];
	Array.isArray(entities) ? data.push(...entities) : data.push(entities);
	return entities;
};

const remove = mongoModel => async query => {
	let data = database[mongoModel.collection.name];
	if (!data) {
		return false;
	}
	const initialLength = data.length;
	data = data.map(d => {
		let allPropMatch = true;
		for (const key in query) {
			const element = query[key];
			if (d[key] != element) {
				allPropMatch = false;
			}
		}
		if (!allPropMatch) {
			return d;
		}
	});

	database[mongoModel.collection.name] = data.filter(t => t !== undefined);

	return database[mongoModel.collection.name].length < initialLength;
};

const fetch = (mongoModel, domainConvertor) => async query => {
	let data = database[mongoModel.collection.name];
	if (!data) {
		return undefined;
	}
	const fetchedData = data.map(d => {
		for (const key in query) {
			const element = query[key];
			if (d[key] != element) {
				return undefined;
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