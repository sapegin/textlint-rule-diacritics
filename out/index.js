'use strict';
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.getCorrection =
	exports.getRegExp =
	exports.getPatterns =
	exports.getPattern =
		void 0;
const fs_1 = __importDefault(require('fs'));
const strip_json_comments_1 = __importDefault(require('strip-json-comments'));
const match_casing_1 = require('match-casing');
const DEFAULT_OPTIONS = {
	words: [],
};
const MARK_GROUPS = [
	"’'",
	'àâäåa',
	'éèêëe',
	'çc',
	'îíi',
	'ñn',
	'öo',
	'šs',
	'ûüu',
	'ÿy',
];
/**
 * Load JSON file, strip comments.
 */
function loadJson(filepath) {
	const json = fs_1.default.readFileSync(require.resolve(filepath), 'utf8');
	return JSON.parse((0, strip_json_comments_1.default)(json));
}
/**
 * Load all default words joined with additional words from a config file
 */
function getWords(words = []) {
	const defaults = loadJson('../words.json');
	const extras = typeof words === 'string' ? loadJson(words) : words;
	return defaults.concat(extras);
}
/**
 * Replace all diacritics with RegExp patterns that match that character with or without a diacritic mark:
 * décor → d[éèêëe]cor
 */
function getPattern(word) {
	return MARK_GROUPS.reduce((pattern, group) => {
		// Strip the last character which is a character without diacritic mark
		const groupPattern = `[${group.substring(0, group.length - 1)}]`;
		return pattern.replace(new RegExp(groupPattern, 'ig'), `[${group}]`);
	}, word);
}
exports.getPattern = getPattern;
/**
 * Get patterns from words list
 */
function getPatterns(words) {
	return words.map(getPattern);
}
exports.getPatterns = getPatterns;
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
 */
function getRegExp(patterns) {
	return new RegExp(`(\\b(?:${patterns.join('|')})\\b)`, 'ig');
}
exports.getRegExp = getRegExp;
/**
 * Return a correct word based on found incorrect word.
 * Keeps case and suffix of an original word.
 */
function getCorrection(words, match) {
	for (const word of words) {
		const pattern = getPattern(word);
		if (!getRegExp([pattern]).test(match)) {
			continue;
		}
		const corrected = match.replace(new RegExp(`\\b${pattern}\\b`, 'i'), word);
		return (0, match_casing_1.matchCasing)(corrected, match);
	}
	return false;
}
exports.getCorrection = getCorrection;
function reporter(context, options = {}) {
	const opts = Object.assign({}, DEFAULT_OPTIONS, options);
	const words = getWords(opts.words);
	// Regexp for all possible mistakes
	const regExp = getRegExp(getPatterns(words));
	const { Syntax, RuleError, report, fixer, getSource } = context;
	return {
		[Syntax.Str](node) {
			return new Promise((resolve) => {
				const text = getSource(node);
				let match;
				while ((match = regExp.exec(text))) {
					const matched = match[0];
					const replacement = getCorrection(words, matched);
					if (
						// Skip correct spelling
						matched === replacement ||
						// Normally this shouldn't happen:
						// all matched words should have replacements
						replacement === false
					) {
						continue;
					}
					console.log('🦀 replacement', replacement);
					const index = match.index;
					const fix = fixer.replaceTextRange(
						[index, index + matched.length],
						replacement
					);
					const message = `Incorrect usage of the word: “${matched}”, use “${replacement}” instead`;
					report(node, new RuleError(message, { index, fix }));
				}
				resolve();
			});
		},
	};
}
const rule = {
	linter: reporter,
	fixer: reporter,
};
exports.default = rule;
//# sourceMappingURL=index.js.map
