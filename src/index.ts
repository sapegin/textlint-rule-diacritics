import fs from 'fs';
import { createRequire } from 'node:module';
import stripJsonComments from 'strip-json-comments';
import { matchCasing } from 'match-casing';
import type {
	TextlintFixableRuleModule,
	TextlintRuleContext,
} from '@textlint/types';
import type { TxtNode } from '@textlint/ast-node-types';

export interface Options {
	// List of additional words: filename, npm module or an array of words
	words?: string | string[];
}

const DEFAULT_OPTIONS: Options = {
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
function loadJson(modulePath: string) {
	const require = createRequire(import.meta.url);
	const resolvedModule = require.resolve(modulePath);
	const json = fs.readFileSync(resolvedModule, 'utf8');
	return JSON.parse(stripJsonComments(json)) as string[];
}

/**
 * Load all default words joined with additional words from a config file
 */
function getWords(words: string | string[] = []) {
	const defaults = loadJson('../words.json');
	const extras = typeof words === 'string' ? loadJson(words) : words;
	return defaults.concat(extras);
}

/**
 * Replace all diacritics with RegExp patterns that match that character with or without a diacritic mark:
 * décor → d[éèêëe]cor
 */
export function getPattern(word: string) {
	return MARK_GROUPS.reduce((pattern, group) => {
		// Strip the last character which is a character without diacritic mark
		const groupPattern = `[${group.substring(0, group.length - 1)}]`;
		return pattern.replace(new RegExp(groupPattern, 'ig'), `[${group}]`);
	}, word);
}

/**
 * Get patterns from words list
 */
export function getPatterns(words: string[]) {
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
 */
export function getRegExp(patterns: string[]) {
	return new RegExp(`(\\b(?:${patterns.join('|')})\\b)`, 'ig');
}

/**
 * Return a correct word based on found incorrect word.
 * Keeps case and suffix of an original word.
 */
export function getCorrection(words: string[], match: string) {
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

function reporter(context: TextlintRuleContext, options: Options = {}) {
	const opts = Object.assign({}, DEFAULT_OPTIONS, options);
	const words = getWords(opts.words);

	// Regexp for all possible mistakes
	const regExp = getRegExp(getPatterns(words));

	const { Syntax, RuleError, report, fixer, getSource } = context;
	return {
		[Syntax.Str](node: TxtNode) {
			return new Promise<void>((resolve) => {
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

const rule: TextlintFixableRuleModule<Options> = {
	linter: reporter,
	fixer: reporter,
};

export default rule;
