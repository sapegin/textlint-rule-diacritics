const fs = require('fs');
const stripJsonComments = require('strip-json-comments');
const matchCasing = require('match-casing');

const DEFAULT_OPTIONS = {
	words: [],
};

const MARK_GROUPS = ["’'", 'àâäåa', 'éèêëe', 'çc', 'îíi', 'ñn', 'öo', 'šs', 'ûüu', 'ÿy'];

function reporter(context, options = {}) {
	const opts = Object.assign({}, DEFAULT_OPTIONS, options);
	const words = getWords(opts.words);

	// Regexp for all possible mistakes
	const regExp = getRegExp(getPatterns(words));

	const { Syntax, RuleError, report, fixer, getSource } = context;
	return {
		[Syntax.Str](node) {
			return new Promise(resolve => {
				const text = getSource(node);

				let match;
				// eslint-disable-next-line no-cond-assign
				while ((match = regExp.exec(text))) {
					const matched = match[0];
					const replacement = getCorrection(words, matched);

					// Skip correct spelling
					if (matched === replacement) {
						continue;
					}

					const index = match.index;
					const range = [index, index + matched.length];
					const fix = fixer.replaceTextRange(range, replacement);
					const message = `Incorrect usage of the word: “${matched}”, use “${replacement}” instead`;
					report(node, new RuleError(message, { index, fix }));
				}

				resolve();
			});
		},
	};
}

/**
 * Load all default words joined with additional worsd from a config file
 *
 * @param {string|string[]} words
 * @return {string[]}
 */
function getWords(words) {
	const defaults = loadJson('./words.json');
	const extras = typeof words === 'string' ? loadJson(words) : words;
	return defaults.concat(extras);
}

/**
 * Load JSON file, strip comments.
 *
 * @param {string} filepath
 * @return {object}
 */
function loadJson(filepath) {
	const json = fs.readFileSync(require.resolve(filepath), 'utf8');
	return JSON.parse(stripJsonComments(json));
}

/**
 * Replace all diacritics with RegExp patterns that match that character with or without a diacritic mark:
 * décor → d[éèêëe]cor
 *
 * @param {string} word
 * @return {string}
 */
function getPattern(word) {
	return MARK_GROUPS.reduce((pattern, group) => {
		// Strip the last character which is a character without diacritic mark
		const groupPattern = `[${group.substring(0, group.length - 1)}]`;
		return pattern.replace(new RegExp(groupPattern, 'ig'), `[${group}]`);
	}, word);
}

/**
 * Get patterns from words list
 *
 * @param {string[]} words
 * @return {string[]}
 */
function getPatterns(words) {
	return words.map(getPattern);
}

/**
 * RegExp from list of patterns.
 *
 * For "résumé" it should match:
 * - resume
 * - résume
 * - résumé
 * - resumes
 * - Resume
 *
 * For "raison d'etre" it should match:
 * - raison d'etre
 * - raison d’etre
 * - raison d'être
 * - Raison d'être
 *
 * @param {string[]} patterns
 * @return {RegExp}
 */
function getRegExp(patterns) {
	return new RegExp(`(\\b(?:${patterns.join('|')})\\b)`, 'ig');
}

/**
 * Return a correct word based on found incorrect word.
 * Keeps case and suffix of an original word.
 *
 * @param {string[]} words
 * @param {string} match
 * @return {string|boolean}
 */
function getCorrection(words, match) {
	for (const word of words) {
		const pattern = getPattern(word);
		if (!getRegExp([pattern]).test(match)) {
			continue;
		}

		const corrected = match.replace(new RegExp(`\\b${pattern}\\b`, 'i'), word);
		return matchCasing(corrected, match);
	}

	return false;
}

module.exports = {
	linter: reporter,
	fixer: reporter,
	test: {
		getPattern,
		getPatterns,
		getRegExp,
		getCorrection,
	},
};
