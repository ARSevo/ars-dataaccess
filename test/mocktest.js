const assert = require('assert');
const { mongomock } = require('../index');
const testModelSchema= new mongomock.Schema({
	a: Number,
	b: Number,
	c: Number,
}, { versionKey: false, timestamps: true });

const testModel = mongomock.model('testmodel', testModelSchema);

const saver = mongomock.save(testModel);
const remover = mongomock.remove(testModel);
const fetcher = mongomock.fetch(testModel);

const Entity = function (a, b, c) {
	this.a = a;
	this.b = b;
	this.c = c;
};

beforeEach(async () => {
	const data = [new Entity(1, 2, 3), new Entity(2, 2, 4)];
	await remover();
	const savedData = await saver(data);
	assert.ok(savedData);
});

describe('mongo connect', function() {
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
	it('should fetch data', async () => {
		const data = await fetcher();
		assert.ok(data);
		assert.equal(data.length, 2);
	});
});

describe('mongo mock remove', function () {
	it('should remove data', async () => {
		assert.ok(await remover({ c: 3, b: 2 }));
		const data = await fetcher();
		assert.ok(data);
		assert.equal(data.a, 2);
		assert.equal(data.b, 2);
		assert.equal(data.c, 4);
	});
	it('should not remove any data if no match', async () => {
		assert.equal(await remover({ a: 3 }), false);
		assert.equal(await remover({ d: 3 }), false);
	});
});