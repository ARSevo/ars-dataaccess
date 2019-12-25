/**
 * Creates a model/document definition for mongo
 * @param {string} name Model name. Used for collection name as plural
 * @param {Schema} schema mongoose Model schema
 * @param {string} collection Mongo collection name. Optional
 */
const model = mongoose => (name, schema, collection = '') => {
	const collectionName = collection || (!name.endsWith('s') ? name + 's' : name);
	return mongoose.model(name, schema, collectionName);
};

const convertToMultiple = convertor => entities => {
	if (Array.isArray(entities)) {
		if (entities.length > 1) {
			return entities.map(entity => convertor(entity));
		}
		return convertor(entities[0]);
	}
	return convertor(entities);
};

const removeId = model => {
	delete model.id;
	delete model._id;
	delete model._doc._id;
	return model;
};

const removeIds = models => Array.isArray(models) ? models.map(t => removeId(t)) : removeId(models);

const save = (mongomodel, modelconvertor = entity => entity, selector) => async entities => {
	const modelConvertors = convertToMultiple(modelconvertor);
	let models = modelConvertors(entities);
	if (!models) {
		return;
	}
	if (Array.isArray(models)) {
		let bulk = mongomodel.collection.initializeOrderedBulkOp();
		for (const model of models) {
			bulk.find(selector(model)).upsert().updateOne(model);
		}
		await bulk.execute();
	} else {
		if (selector) {
			removeIds(models);
			return await mongomodel.findOneAndUpdate(selector(models), models, { upsert: true, setDefaultsOnInsert: true, new: true });
		}
		return [models.save()];
	}
};

const fetch = (mongomodel, domainconvertor = entity => entity) => async (condition = new Object()) => {
	return await pureFetch(mongomodel, domainconvertor)(condition);
};

const fetchById = (mongomodel, domainconvertor = entity => entity) => async id => {
	return await pureFetch(mongomodel, domainconvertor)({ _id: id });
};

const paginate = (mongomodel, domainconvertor = entity => entity) => async (condition = {}, paging = null, includedFields = null) => {
	const count = await mongomodel.count(condition);

	if (paging) {
		paging.limit = paging.limit || 10;
		paging.sort = paging.sort || { _id: 1 };
		paging.skip = (!paging.page || paging.page === 0) ? 0 : (paging.page - 1) * paging.limit;
	}

	const docs = await pureFetch(mongomodel, domainconvertor)(condition, paging, includedFields) || [];
	return { docs: Array.isArray(docs) ? docs : [docs], count, page: (paging.skip / paging.limit) + 1 };
};

const pureFetch = (mongomodel, domainconvertor = entity => entity) => async (condition = {}, paging = null, includedFields = null) => {
	const doc = await mongomodel.find(condition, includedFields, paging);
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
	model,
	save,
	fetch,
	fetchById,
	paginate,
	remove,
	convertToMultiple
};