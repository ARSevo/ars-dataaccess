const assert = require('assert');
const { mongomock } = require('../index');
const testModelSchema = new mongomock.Schema({
	a: Number,
	b: Number,
	c: Number,
}, { versionKey: false, timestamps: true });

const testModel = mongomock.model('testmodel', testModelSchema);
const notExistCollection = mongomock.model('notexistcollection', testModelSchema);

const saver = mongomock.save(testModel);
const remover = mongomock.remove(testModel);
const fetcher = mongomock.fetch(testModel);

const Entity = function (a, b, c) {
	this.a = a;
	this.b = b;
	this.c = c;
};

beforeEach(async () => {
	const data = [new Entity(1, 2, 3), new Entity(2, 2, 4), new Entity(7, 2, 0)];
	await remover();
	const savedData = await saver(data);
	assert.ok(savedData);
});

describe('mongo connect', function () {
	it('should connect successfully', async () => {
		assert.ok(await mongomock.connect('mongodbConnectionString'));
	});
	it('should fail on connect w/o connectionString', async () => {
		assert.notEqual(await mongomock.connect(), true);
	});
});

describe('mongo save', function () {
	it('should save one entity', async () => {
		const entity = new Entity(1, 1, 1);
		const savedData = await saver(entity);
		assert.ok(savedData);
		assert.equal(savedData.a, 1);
		const data = await fetcher({ a: 1, b: 1, c: 1 });
		assert.ok(data);
		assert.deepEqual(data, entity);
	});
});

describe('mongo fetch', function () {
	it('should fetch all data', async () => {
		const data = await fetcher();
		assert.ok(data);
		assert.equal(data.length, 3);
	});
	it('should return matched data', async () => {
		const data = await fetcher({ a: 1 });
		assert.ok(data);
		assert.deepStrictEqual(data, new Entity(1, 2, 3));
	});
	it('should return undefined on a not found collection', async function () {
		const undefinedFetcher = mongomock.fetch(notExistCollection);
		const data = await undefinedFetcher();
		assert.equal(data, undefined, 'should return undefined');
	});
});

describe('mongo mock remove', function () {
	it('should remove data', async () => {
		assert.ok(await remover({ c: 3, a: 1 }));
		const data = await fetcher({ a: 7});
		assert.ok(data);
		assert.equal(data.a, 7);
		assert.equal(data.b, 2);
		assert.equal(data.c, 0);
	});
	it('should not remove any data if no match', async () => {
		assert.equal(await remover({ a: 3 }), false);
		assert.equal(await remover({ d: 3 }), false);
	});
	it('should remove all matching data', async () => {
		assert.ok(await remover({ b: 2 }));
		const data = await fetcher();
		assert.strictEqual(data, null);
	});
});