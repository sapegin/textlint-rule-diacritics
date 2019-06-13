const TextLintTester = require('textlint-tester');
const rule = require('./index');

const { getPattern, getPatterns, getRegExp, getCorrection } = rule.test;
const tester = new TextLintTester();

describe('getPattern', () => {
	it('should replace all symbols from groups with corresponding regexp patterns', () => {
		const result = getPattern('résumé');
		expect(result).toBe('r[éèêëe]sum[éèêëe]');
	});

	it('should replace apostrophes with corresponding regexp patterns', () => {
		const result = getPattern('d’état');
		expect(result).toBe("d[’'][éèêëe]tat");
	});
});

describe('getPatterns', () => {
	it('should return an array of patterns', () => {
		const words = ['décor', 'résumé'];
		const result = getPatterns(words);
		expect(result).toHaveLength(words.length);
	});
});

describe('getRegExp', () => {
	const patterns = ['r[éèêëe]sum[éèêëe]', 'd[éèêëe]cor'];
	it('should match a pattern as a full word', () => {
		const result = getRegExp(patterns).exec('My resume is good');
		expect(result).toBeTruthy();
		expect(result[1]).toBe('resume');
	});

	it('should not match a pattern only at the beginning of a word', () => {
		const result = getRegExp(patterns).exec('All resumes are terrible');
		expect(result).toBeFalsy();
	});

	it('should not match a pattern in the middle of a word', () => {
		const result = getRegExp(patterns).exec('Foo undecorated bar');
		expect(result).toBeFalsy();
	});

	it('should match a pattern if some marks are present', () => {
		const result = getRegExp(patterns).exec('My résume is good');
		expect(result).toBeTruthy();
		expect(result[1]).toBe('résume');
	});

	it('should match a pattern regardless of its case', () => {
		const result = getRegExp(patterns).exec('Resume is good');
		expect(result).toBeTruthy();
		expect(result[1]).toBe('Resume');
	});

	it('should match several patterns', () => {
		const regexp = getRegExp(patterns);
		const text = 'My résume and your décor';
		const result1 = regexp.exec(text);
		expect(result1).toBeTruthy();
		expect(result1[1]).toBe('résume');
		const result2 = regexp.exec(text);
		expect(result2).toBeTruthy();
		expect(result2[1]).toBe('décor');
	});
});

describe('getCorrection', () => {
	const words = ['crème fraîche', 'crêpe', 'crêpes', 'débutante'];

	it('should return a correct word', () => {
		const result = getCorrection(words, 'crepe');
		expect(result).toBe('crêpe');
	});

	it('should keep suffix', () => {
		const result = getCorrection(words, 'crepes');
		expect(result).toBe('crêpes');
	});

	it('should keep original case', () => {
		const result = getCorrection(words, 'Crepe');
		expect(result).toBe('Crêpe');
	});

	it('should return false if match not found', () => {
		const result = getCorrection(words, 'pizza');
		expect(result).toBeFalsy();
	});
});

tester.run('textlint-rule-diacritics', rule, {
	valid: [
		{
			text: 'My crêpe is good',
		},
		{
			text: 'I was touched by her feelings.',
		},
	],
	invalid: [
		{
			// One word
			text: 'My crepe is good',
			output: 'My crêpe is good',
			errors: [
				{
					message: 'Incorrect usage of the word: “crepe”, use “crêpe” instead',
				},
			],
		},
		{
			// Several words, keep case, keep suffix
			text: 'My resume has doppelgangers',
			output: 'My résumé has doppelgängers',
			errors: [
				{
					message:
						'Incorrect usage of the word: “My resume”, use “My résumé” instead',
				},
				{
					message:
						'Incorrect usage of the word: “doppelgangers”, use “doppelgängers” instead',
				},
			],
		},
		{
			text: 'She yelled "touche" as she lunged forward.',
			output: 'She yelled "touché" as she lunged forward.',
			errors: [
				{
					message:
						'Incorrect usage of the word: “touche”, use “touché” instead',
				},
			],
		},
	],
});
