const assert = require('assert');
const { mongo, mongohelper, sql } = require('../index');
const mongoose = require('mongoose');
const testconfig = require('./config');

const testSchema = new mongoose.Schema({
	name: String,
	value: Number
});
const sqlConnectionParams = new sql.ConnectionParams(
	testconfig.sqlserverUser,
	testconfig.sqlserverPwd,
	testconfig.sqlserverConnection,
	testconfig.sqlServerDatabase
);

const testModel = mongoose.model('test', testSchema, 'testCollection');
const modelConverter = entity => {
	const entityClone = { ...entity };
	delete entityClone.Id;
	const model = new testModel(entityClone);
	delete model._doc._id;
	return model;
};
const selector = entity => ({
	name: entity.name
});
const testModelSaver = mongohelper.save(testModel, mongohelper.convertToModels(modelConverter), selector);
const testModelSaverDefault = mongohelper.save(testModel);
const testModelRemover = mongohelper.remove(testModel);
const testModelFetcher = mongohelper.fetch(testModel);

after(async () => {
	await testModelRemover({ name: 'test' });
	await mongo.disconnect();
	await sql.disconnect();
	process.exit();
});

describe('mongo', function () {
	it('should connect to mongo successfully', async () => {
		try {
			assert.ok(await mongo.connect(testconfig.mongodbConnection), 'failed to connect');
		} catch (ex) {
			assert.fail(ex);
		}
	});
	const savedObject = {
		name: 'test',
		value: 1
	};
	it('should insert model', async () => {
		const updatedDoc = await testModelSaver(savedObject);
		assert.equal(updatedDoc, null);
	});
	it('should update model', async () => {
		savedObject.value = 2;
		const updatedDoc = await testModelSaver(savedObject);
		assert.notEqual(updatedDoc, null);
	});
	it('should fetch model', async () => {
		const updatedDoc = await testModelFetcher({ name: 'test' });
		assert.notEqual(updatedDoc, null);
		assert.equal(updatedDoc.value, 2);
	});
	it('should remove model', async () => {
		const result = await testModelRemover({ name: 'test' });
		assert.ok(result);
	});
	it('should insert model (default saver)', async () => {
		savedObject.value = 3;
		const updatedDoc = await testModelSaverDefault(savedObject);
		assert.equal(updatedDoc, null);
	});
	it('should update model (default saver)', async () => {
		savedObject.value = 4;
		const updatedDoc = await testModelSaverDefault(savedObject);
		assert.notEqual(updatedDoc, null);
	});
});


describe('sql', function () {
	it('should connect to sql successfully', async () => {
		try {
			assert.ok(await sql.connect(sqlConnectionParams), 'failed to connect');
		} catch (ex) {
			assert.fail(ex.message || ex);
		}
	});
});