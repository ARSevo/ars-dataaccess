/* eslint-disable */
const mongo = require('./mongo');
const { convertToMultiple } = require('./mongohelper');
const { isString } = require('util');
let database = {};
const connect = async mongodbConnection => {
	return isString(mongodbConnection);
};

const isMatchingObject = function (obj, query) {
	for (const key in query) {
		const element = query[key];
		if (obj[key] != element) {
			return undefined;
		}
	}
	return true;
};

const noKeyQuery = function (query) {
	return Object.keys(query).length === 0;
};

const isConditionalQuery = condition => query => query[condition];

const isOrQuery = isConditionalQuery('$or');
const isAndQuery = isConditionalQuery('$and');
const isInQuery = query => JSON.stringify(query).includes('$in');

const find = (collection, query) => {
	if (noKeyQuery(query)) {
		return collection;
	}
	const fetchedData = collection.reduce((pre, cur) => {
		const orConditions = isOrQuery(query);
		if (orConditions) {
			for (let i = 0; i < orConditions.length; i++) {
				const condition = orConditions[i];
				if (isMatchingObject(cur, condition)) {
					pre.push(cur)
					return pre;
				}
			}
		}
		const andConditions = isAndQuery(query);
		if (andConditions) {
			for (let i = 0; i < andConditions.length; i++) {
				const condition = andConditions[i];
				if (!isMatchingObject(cur, condition)) {
					return pre;
				}
			}
			pre.push(cur);
			return pre;
		}
		const inConditions = isInQuery(query);
		if (inConditions) {
			const key = Object.keys(query)[0];
			const keyValues = query[key]['$in'];

			if (keyValues.includes(cur[key])) {
				pre.push(cur);
				return pre;
			}
		}
		if (isMatchingObject(cur, query)) {
			pre.push(cur);
		}
		return pre;
	}, []);

	if (fetchedData.length === 0) {
		return null;
	}
	return fetchedData;
}

const convertId = obj => {
	const entity = Object.assign({}, obj);
	const doc = entity._doc || entity;
	if (doc && obj.id) {
		doc.id = obj.id;
		doc._id = obj.id;
	}
	return doc;
};

const convertIdInObject = obj => Array.isArray(obj) ?
	obj.map(q => convertId(q)) : convertId(obj);

const save = (mongoModel, modelconvertor = entity => entity, selector) => async entities => {
	const modelConvertors = convertToMultiple(modelconvertor);

	if (!database[mongoModel.collection.name]) {
		database[mongoModel.collection.name] = [];
	};
	const data = database[mongoModel.collection.name]
	const models = modelConvertors(entities);
	if (!models) {
		return;
	}
	if (selector || !Array.isArray(models)) {
		const existing = find(data, selector(models));
		if (existing) {
			const existingModel = modelConvertors(existing);
			await remove(mongoModel)(selector(existingModel));
			entities.id = existingModel.id;
			database[mongoModel.collection.name].push(convertIdInObject(entities));
			return modelConvertors(entities);
		}
	}
	Array.isArray(models) ? data.push(...convertIdInObject(models)) : data.push(convertIdInObject(models));
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

	const domainConvertors = convertToMultiple(domainconvertor);

	const fetchedData = find(data, query);
	if (fetchedData) {
		const data = fetchedData.map(data => {
			return {
				...data,
				save: async function () {
					await remove(mongoModel)(data);
					database[mongoModel.collection.name].push(convertIdInObject(this));
				}
			};
		});
		return domainConvertors(data);
	}

	return undefined;
};

const paginate = (mongoModel, domainconvertor = entity => entity) => async (query = new Object()) => {
	const docs = await fetch(mongoModel, domainconvertor)(query);

	return { docs, count: docs ? docs.length : 0 };
};

const fetchById = (mongoModel, domainconvertor = entity => entity) => async id =>
	await fetch(mongoModel, domainconvertor)({ _id: id });

module.exports = {
	connect: connect,
	model: mongo.model,
	save,
	remove,
	fetch,
	fetchById,
	paginate,
	Schema: mongo.Schema,
	mongoConnectionState: mongo.mongoConnectionState,
	disconnect: async () => { }
};