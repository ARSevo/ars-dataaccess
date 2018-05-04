'use strict';
const { mongoose } = require('./mongo');
const util = require('util');

const convertToMultiple = convertor => entities => {
	if (util.isArray(entities)) {
		if (entities.length > 1) {
			return entities.map(entity => convertor(entity));
		}
		return convertor(entities[0]);
	}
	return convertor(entities);
};

const save = (mongomodel = mongoose.Model, modelconvertor = entity => entity, selector = () => Object.freeze({})) => async entities => {
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
		return await mongomodel.findOneAndUpdate(selector(models), models, { upsert: true, setDefaultsOnInsert: true });
	}
};

const fetch = (mongomodel = mongoose.Model, domainconvertor = entity => entity) => async (condition = new Object()) => {
	const doc = await mongomodel.find(condition);
	if (doc.length === 0) {
		return null;
	}
	const domainConvertors = convertToMultiple(domainconvertor);
	return domainConvertors(doc);
};

const remove = (mongomodel = mongoose.Model) => async (condition = new Object()) => {
	return (await mongomodel.remove(condition)).n > 0;
};

module.exports = {
	save: save,
	fetch: fetch,
	remove: remove,
};