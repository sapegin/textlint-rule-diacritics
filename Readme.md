# textlint-rule-diacritics

[![textlint fixable rule](https://img.shields.io/badge/textlint-fixable-green.svg?style=social)](https://textlint.github.io/)
[![Build Status](https://travis-ci.org/sapegin/textlint-rule-diacritics.svg)](https://travis-ci.org/sapegin/textlint-rule-diacritics)
[![npm](https://img.shields.io/npm/v/textlint-rule-diacritics.svg)](https://www.npmjs.com/package/textlint-rule-diacritics)

[Textlint](https://github.com/textlint/textlint) rule to check correct usage of diacritics.

For example:

* creme brulee → crème brûlée
* deja vu → déjà vu
* senorita → señorita
* doppelganger → doppelgänger

(You can customize the rules as you wish.)

![](https://d3vv6lp55qjaqc.cloudfront.net/items/1p0s3e2p1U1m1r3N2Q41/diacritics.png)

## Installation

```shell
npm install textlint-rule-diacritics
```

## Usage

```shell
textlint --fix --rule diacritics Readme.md
```

## Configuration

By default the rule will check against my personal [diacritics](./words.json). You can change it in your `.textlintrc`:

```js
{
  "rules": {
    "diacritics": {
      // List of additional words
      "words": [
        "tâmia",
      ],
      // OR load words from a file
      "words": "~/words.json",
      // OR load words from npm
      "words": "@johnsmith/words"
    }
  }
}
```

Read more about [configuring textlint](https://github.com/textlint/textlint/blob/master/docs/configuring.md).

## Changelog

The changelog can be found on the [Releases page](https://github.com/sapegin/textlint-rule-diacritics/releases).

## Contributing

Everyone is welcome to contribute. Please take a moment to review the [contributing guidelines](Contributing.md).

## Authors and license

[Artem Sapegin](http://sapegin.me) and [contributors](https://github.com/sapegin/textlint-rule-diacritics/graphs/contributors).

MIT License, see the included [License.md](License.md) file.

Inspired by [retext-diacritics](https://github.com/wooorm/retext-diacritics).

Dictionary source: [Wiktionary](https://en.wiktionary.org/wiki/Appendix:English_words_with_diacritics).
