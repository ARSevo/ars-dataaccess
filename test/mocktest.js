const assert = require('assert');
const { mongomock } = require('../index');
const testModelSchema = new mongomock.Schema({
	a: Number,
	b: Number,
	c: Number,
}, { versionKey: false, timestamps: true });

const testModel = mongomock.model('testmodel', testModelSchema);
const notExistCollection = mongomock.model('notexistcollection', testModelSchema);

const saver = mongomock.save(testModel, undefined, entity => ({ c: entity.c }));
const remover = mongomock.remove(testModel);
const fetcher = mongomock.fetch(testModel);

const Entity = function (a, b, c) {
	this.a = a;
	this.b = b;
	this.c = c;
};

beforeEach(async () => {
	const data = [new Entity(1, 2, 3), new Entity(2, 2, 4), new Entity(7, 2, 0), new Entity(1, 2, 11)];
	await remover();
	const savedData = await saver(data);
	assert.ok(savedData);
});

describe('mongo connect', function () {
	it('should connect successfully', async () => {
		assert.ok(await mongomock.connect('mongodbConnectionString'));
	});
	it('should fail on connect w/o connectionString', async () => {
		assert.strictEqual(await mongomock.connect(), false);
	});
});

describe('mongo save', function () {
	it('should save one entity', async () => {
		const entity = new Entity(1, 1, 1);
		const savedData = await saver(entity);
		assert.ok(savedData);
		assert.strictEqual(savedData.a, 1);
		const data = await fetcher({ a: 1, b: 1, c: 1 });
		assert.ok(data);
		assert.strictEqual(data.a, 1);
		assert.strictEqual(data.b, 1);
		assert.strictEqual(data.c, 1);
	});
	it('should update one entity', async () => {
		const existing = await fetcher({ c: 11 });
		const updaterObject = { ...existing };
		updaterObject.b = 0;
		const updated = await saver(updaterObject);
		assert.strictEqual(updated.b, 0);
		const data = await fetcher({});
		assert.strictEqual(data.length, 4);
	});
});

describe('mongo fetch', function () {
	it('should fetch all data', async () => {
		const data = await fetcher();
		assert.ok(data);
		assert.strictEqual(data.length, 4);
	});
	it('should return matched data', async () => {
		const data = await fetcher({ a: 7 });
		assert.ok(data);
		assert.strictEqual(data.a, 7);
		assert.strictEqual(data.b, 2);
		assert.strictEqual(data.c, 0);
	});
	it('should return multiple matched data with $and expression', async () => {
		const data = await fetcher({ $and: [{ a: 1 }, { b: 2 }] });
		assert.ok(data);
		assert.strictEqual(data.length, 2);
		const matched = data.find(t => t.c === 11);
		assert.strictEqual(matched.a, 1);
	});
	it('should return single matched data with $and expression', async () => {
		const data = await fetcher({ $and: [{ a: 1 }, { c: 11 }, { b: 2 }] });
		assert.ok(data);
		assert.strictEqual(data.a, 1);
		assert.strictEqual(data.b, 2);
		assert.strictEqual(data.c, 11);
	});
	it('should return single matched data with $or expression', async () => {
		const data = await fetcher({ $or: [{ a: 0 }, { c: 4 }] });
		assert.strictEqual(data.a, 2);
	});
	it('should return multiple matched data with $or expression', async () => {
		const data = await fetcher({ $or: [{ a: 1 }, { b: 2 }] });
		assert.ok(data);
		assert.ok(data.length === 4);
		const data2 = data.filter(t => t.b === 2);
		assert.ok(data2);
		assert.strictEqual(data2.length, 4);
		const data3 = data.find(t => t.c === 4);
		assert.ok(data3);
		assert.strictEqual(data3.c, 4);
	});
	it('should return multiple matched data with $in expression', async () => {
		const data = await fetcher({ 'a': { $in: [1, 2, 3, 4, 5] } });
		assert.ok(data);
		assert.strictEqual(data.length, 3);
	});
	it('should return single matched data with $in expression', async () => {
		const data = await fetcher({ 'c': { $in: [11, 2, 13, 14, 5] } });
		assert.ok(data);
		assert.strictEqual(data.c, 11);
		assert.strictEqual(data.a, 1);
	});
	it('should return undefined on a not found collection', async function () {
		const undefinedFetcher = mongomock.fetch(notExistCollection);
		const data = await undefinedFetcher();
		assert.strictEqual(data, undefined, 'should return undefined');
	});
});

describe('mongo mock remove', function () {
	it('should remove data', async () => {
		assert.ok(await remover({ c: 3, a: 1 }));
		const data = await fetcher({ a: 7 });
		assert.ok(data);
		assert.strictEqual(data.a, 7);
		assert.strictEqual(data.b, 2);
		assert.strictEqual(data.c, 0);
	});
	it('should not remove any data if no match', async () => {
		assert.strictEqual(await remover({ a: 3 }), false);
		assert.strictEqual(await remover({ d: 3 }), false);
	});
	it('should remove all matching data', async () => {
		assert.ok(await remover({ b: 2 }));
		const data = await fetcher();
		assert.strictEqual(data, undefined);
	});
});

describe('mongo mock save prototype for entity object', function () {
	it('should return entity with save prototype', async () => {
		const data = await fetcher({ a: 7 });
		assert.ok(data);
		assert.strictEqual(data.a, 7);
		assert.strictEqual(data.b, 2);
		assert.strictEqual(data.c, 0);
		assert.ok(data.save);
	});
	it('should update entity with new values', async () => {
		const data = await fetcher({ a: 7 });
		assert.ok(data);
		assert.strictEqual(data.a, 7);
		assert.strictEqual(data.b, 2);
		assert.strictEqual(data.c, 0);
		assert.ok(data.save);

		data.b = 11;
		data.c = 12;
		await data.save();

		const updatedData = await fetcher({ a: 7 });
		assert.ok(updatedData);
		assert.strictEqual(updatedData.a, 7);
		assert.strictEqual(updatedData.b, 11);
		assert.equal(updatedData.c, 12);
		assert.ok(updatedData.save);
	});
});