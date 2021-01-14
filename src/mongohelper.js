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
		return await bulk.execute();
	} else {
		if (selector) {
			const original = await pureFetch(mongomodel)(selector(models));
			if (!original) {
				return await models.save();
			}
			// We need to have the original dates to prevent overwriting updatedAt field.
			// This will throw DocumentNotFoundError, because of the plugin (Concurrancy error)
			const storedCreatedAt = new Date(original.createdAt);
			const storedUpdatedAt = new Date(original.updatedAt);
			const storedId = original._doc._id;

			models._doc._id = storedId;
			models.isNew = false;
			models.createdAt = storedCreatedAt;
			models.updatedAt = storedUpdatedAt;

			return await models.save();
		}
		return models.save();
	}
};

const fetch = (mongomodel, domainconvertor = entity => entity) => async (condition = new Object()) => {
	return await pureFetch(mongomodel, domainconvertor)(condition);
};

const fetchById = (mongomodel, domainconvertor = entity => entity) => async id => {
	return await pureFetch(mongomodel, domainconvertor)({ _id: id });
};

const paginate = (mongomodel, domainconvertor = entity => entity) => async (condition = {}, paging = null, includedFields = null) => {
	const count = await mongomodel.countDocuments(condition);

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
	return (await mongomodel.deleteMany(condition)).n > 0;
};

const copyTo = mongomodel => async copyTo => {
	await mongomodel.aggregate([{ $match: {} }, { $out: copyTo }]);
};

module.exports = {
	model,
	save,
	fetch,
	fetchById,
	paginate,
	remove,
	copyTo,
	convertToMultiple
};