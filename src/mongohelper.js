'use strict';
const util = require('util');

/**
 * Creates a model/document definition for mongo
 * @param {string} name Model name. Used for collection name as plural
 * @param {Schema} schema mongoose Model schema
 */
const model = mongoose => (name, schema) => {
	const collectionName = !name.endsWith('s') ? name + 's' : name;
	return mongoose.model(name, schema, collectionName);
};

const convertToMultiple = convertor => entities => {
	if (util.isArray(entities)) {
		if (entities.length > 1) {
			return entities.map(entity => convertor(entity));
		}
		return convertor(entities[0]);
	}
	return convertor(entities);
};

const save = (mongomodel, modelconvertor = entity => entity, selector = () => Object.freeze({})) => async entities => {
	const modelConvertors = convertToMultiple(modelconvertor);
	let models = modelConvertors(entities);
	if (!models) {
		return;
	}
	if (util.isArray(models)) {
		let bulk = mongomodel.collection.initializeOrderedBulkOp();
		for (const model of models) {
			bulk.find(selector(model)).upsert().updateOne(model);
		}
		await bulk.execute();
	} else {
		return await mongomodel.findOneAndUpdate(selector(models), models, { upsert: true, setDefaultsOnInsert: true, new: true });
	}
};

const fetch = (mongomodel, domainconvertor = entity => entity) => async (condition = new Object()) => {
	const doc = await mongomodel.find(condition);
	if (doc.length === 0) {
		return null;
	}
	const domainConvertors = convertToMultiple(domainconvertor);
	return domainConvertors(doc);
};

const remove = mongomodel => async (condition = new Object()) => {
	return (await mongomodel.remove(condition)).n > 0;
};

module.exports = {
	model: model,
	save: save,
	fetch: fetch,
	remove: remove,
};