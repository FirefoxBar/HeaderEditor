import assert from 'node:assert';
import { IS_MATCH } from '@/share/core/constant';
import {
  createUrlFilterRegex,
  getRegexFlags,
  initRule,
  isIgnoreCase,
  isMatchUrl,
} from '@/share/core/rule-utils';

const baseRule = {
  enable: true,
  name: 'test',
  ruleType: 'modifySendHeader',
  isFunction: false,
  code: '',
  group: 'default',
};

const regex = '^https://example\\.com/[a-z]+$';
const urlFilter = '||example.com^path';

describe('rule-utils', () => {
  describe('ignoreCase', () => {
    describe('isIgnoreCase', () => {
      it('defaults to true (DNR isUrlFilterCaseSensitive defaults to false)', () => {
        assert.strictEqual(isIgnoreCase({}), true);
        assert.strictEqual(isIgnoreCase({ condition: {} }), true);
        assert.strictEqual(isIgnoreCase({ condition: { regex: 'a' } }), true);
        assert.strictEqual(
          isIgnoreCase({ condition: { ignoreCase: true } }),
          true,
        );
      });

      it('is false only when explicitly disabled', () => {
        assert.strictEqual(
          isIgnoreCase({ condition: { ignoreCase: false } }),
          false,
        );
      });
    });

    describe('getRegexFlags', () => {
      it('builds flags for both matching and replacing', () => {
        assert.strictEqual(getRegexFlags(true), 'i');
        assert.strictEqual(getRegexFlags(false), '');
        assert.strictEqual(getRegexFlags(true, true), 'gi');
        assert.strictEqual(getRegexFlags(false, true), 'g');
      });
    });

    describe('createUrlFilterRegex', () => {
      it('ignores case by default', () => {
        assert.strictEqual(
          createUrlFilterRegex('example.com').test('https://EXAMPLE.COM'),
          true,
        );
      });

      it('is case sensitive when ignoreCase is false', () => {
        const reg = createUrlFilterRegex('example.com', false);
        assert.strictEqual(reg.flags.includes('i'), false);
        assert.strictEqual(reg.test('https://example.com'), true);
        assert.strictEqual(reg.test('https://EXAMPLE.COM'), false);
      });
    });

    describe('regex condition (web_request runner)', () => {
      it('ignores case by default', () => {
        const rule = initRule({ ...baseRule, condition: { regex } }, true);
        assert.strictEqual(rule._reg.flags.includes('i'), true);
        assert.strictEqual(
          isMatchUrl(rule, 'https://EXAMPLE.COM/Path'),
          IS_MATCH.MATCH,
        );
      });

      it('is case sensitive when ignoreCase is false', () => {
        const rule = initRule(
          { ...baseRule, condition: { regex, ignoreCase: false } },
          true,
        );
        assert.strictEqual(rule._reg.flags.includes('i'), false);
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/path'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://EXAMPLE.COM/Path'),
          IS_MATCH.NOT_MATCH,
        );
      });
    });

    describe('regex condition (DNR runner, regex built on demand)', () => {
      it('follows ignoreCase when _reg was not precompiled', () => {
        const loose = initRule({ ...baseRule, condition: { regex } });
        assert.strictEqual(loose._reg, undefined);
        assert.strictEqual(
          isMatchUrl(loose, 'https://EXAMPLE.COM/Path'),
          IS_MATCH.MATCH,
        );

        const strict = initRule({
          ...baseRule,
          condition: { regex, ignoreCase: false },
        });
        assert.strictEqual(
          isMatchUrl(strict, 'https://EXAMPLE.COM/Path'),
          IS_MATCH.NOT_MATCH,
        );
      });
    });

    describe('urlFilter condition', () => {
      it('ignores case by default', () => {
        const rule = initRule({ ...baseRule, condition: { urlFilter } }, true);
        assert.strictEqual(rule._filter_reg.flags.includes('i'), true);
        assert.strictEqual(
          isMatchUrl(rule, 'https://EXAMPLE.COM/path'),
          IS_MATCH.MATCH,
        );
      });

      it('is case sensitive when ignoreCase is false', () => {
        const rule = initRule(
          { ...baseRule, condition: { urlFilter, ignoreCase: false } },
          true,
        );
        assert.strictEqual(rule._filter_reg.flags.includes('i'), false);
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/path'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://EXAMPLE.COM/path'),
          IS_MATCH.NOT_MATCH,
        );
      });
    });

    describe('excludeRegex', () => {
      it('is not affected by ignoreCase', () => {
        const rule = initRule(
          {
            ...baseRule,
            condition: {
              urlPrefix: 'https://example.com/',
              excludeRegex: '/Private/',
              ignoreCase: true,
            },
          },
          true,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/private'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/Private/x'),
          IS_MATCH.EXCLUDE,
        );
      });
    });
  });
});
