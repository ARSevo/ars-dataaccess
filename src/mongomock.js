/* eslint-disable */
const mongo = require('./mongo');
const { convertToMultiple } = require('./mongohelper');
const { isString } = require('util');
let database = {};
const connect = async mongodbConnection => {
	return isString(mongodbConnection);
};

const save = (mongoModel,  modelconvertor = entity => entity, selector) => async entities => {
	const modelConvertors = convertToMultiple(modelconvertor);
	let models = modelConvertors(entities);
	if (!models) {
		return;
	}
	database[mongoModel.collection.name] = [];
	let data = database[mongoModel.collection.name];
	Array.isArray(models) ? data.push(...models) : data.push(models);
	return models;
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

const fetch = (mongoModel, domainconvertor = entity => entity) => async (query = new Object()) => {
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

	if (fetchedData.length === 0) {
		return null;
	}
	const domainConvertors = convertToMultiple(domainconvertor);
	return domainConvertors(fetchedData);
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