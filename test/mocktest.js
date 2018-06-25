const assert = require('assert');
const { mongomock } = require('../index');

before(async () => {
	let data = [{
		a: 1,
		b: 2,
		c: 3,
	}, {
		a: 2,
		b: 2,
		c: 4
	}];

	const saver = mongomock.save();
	const savedData = await saver(data);
	assert.ok(savedData);
});

describe('mongo mock remove', function () {
	it('should remove data', async () => {
		const remover = mongomock.remove();
		let res = await remover({ c: 3, b: 2 });
		assert.ok(res);
		res = await remover({ d: 1 });
		assert.equal(res, false);
	});
});