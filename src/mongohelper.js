'use strict';
const mongoose = require('mongoose');
const util = require('util');

const save = (mongomodel = mongoose.Model, modelconvertor = entity => entity, selector = () => Object.freeze({})) => async entities => {
	let models = modelconvertor(entities);
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

const convertToModels = modelconvertor => entities => {
	if (util.isArray(entities)) {
		return entities.map(entity => modelconvertor(entity));
	}
	return modelconvertor(entities);
};

const fetch = (mongomodel = mongoose.Model) => async (condition = new Object()) => {
	const doc = await mongomodel.find(condition);
	return !doc ? null : doc.length > 1 ? doc : doc[0];
};

const remove = (mongomodel = mongoose.Model) => async (condition = new Object()) => {
	return (await mongomodel.remove(condition)).n > 0;
};

module.exports = {
	save: save,
	convertToModels: convertToModels,
	fetch: fetch,
	remove: remove,
};