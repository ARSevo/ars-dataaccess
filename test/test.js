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
const testModelRemover = mongohelper.remove(testModel);

after(async () => {
	await testModelRemover({name : 'test'});
	await mongo.disconnect();
	await sql.disconnect();
});

describe('mongo', function () {
	it('should connect to mongo successfully', async () => {
		try {
			assert.ok(await mongo.connect(testconfig.mongodbConnection), 'failed to connect');
		} catch (ex) {
			assert.fail(ex);
		}
	});
	it('should save model', async () => {
		const savedObject = {
			name : 'test',
			value : 1
		};
		const updatedDoc = await testModelSaver(savedObject);
		assert.equal(updatedDoc, null);
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