import assert from 'node:assert';
import { IS_MATCH } from '@/share/core/constant';
import { initRule, isMatchUrl } from '@/share/core/rule-utils';

describe('rule-utils', () => {
  describe('isMatchUrl', () => {
    const baseRule = {
      enable: true,
      name: 'test',
      ruleType: 'modifySendHeader',
      isFunction: false,
      code: '',
      group: 'default',
    };

    describe('new condition format (rule.condition)', () => {
      it('should match exact url', () => {
        const rule = initRule({
          ...baseRule,
          condition: { url: 'https://example.com/path' },
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/path'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/other'),
          IS_MATCH.NOT_MATCH,
        );
      });

      it('should match urlPrefix', () => {
        const rule = initRule({
          ...baseRule,
          condition: { urlPrefix: 'https://example.com/api' },
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/api/users'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/apiv2'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/other'),
          IS_MATCH.NOT_MATCH,
        );
      });

      it('should match domain array', () => {
        const rule = initRule({
          ...baseRule,
          condition: { domain: ['example.com', 'test.com'] },
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/path'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://test.com/path'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://other.com/path'),
          IS_MATCH.NOT_MATCH,
        );
      });

      it('should match urlFilter (adblock-style)', () => {
        const rule = initRule({
          ...baseRule,
          condition: { urlFilter: '||example.com^' },
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/path'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://sub.example.com/path'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://otherexample.com/path'),
          IS_MATCH.NOT_MATCH,
        );
      });

      it('should match regex', () => {
        const rule = initRule({
          ...baseRule,
          condition: { regex: '^https://example\\.com/\\d+$' },
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/123'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/abc'),
          IS_MATCH.NOT_MATCH,
        );
      });

      it('should exclude by excludeDomain', () => {
        const rule = initRule({
          ...baseRule,
          condition: {
            domain: ['example.com', 'sub.example.com'],
            excludeDomain: ['sub.example.com'],
          },
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/path'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://sub.example.com/path'),
          IS_MATCH.MATCH_BUT_EXCLUDE,
        );
      });

      it('should exclude by excludeRegex', () => {
        const rule = initRule({
          ...baseRule,
          condition: {
            urlPrefix: 'https://example.com/',
            excludeRegex: '/api/private',
          },
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/api/public'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/api/private/data'),
          IS_MATCH.MATCH_BUT_EXCLUDE,
        );
      });

      it('should combine multiple conditions (AND logic)', () => {
        const rule = initRule({
          ...baseRule,
          condition: {
            urlPrefix: 'https://example.com/',
            domain: ['example.com'],
          },
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/api'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://other.com/api'),
          IS_MATCH.NOT_MATCH,
        );
      });

      it('should return MATCH_BUT_EXCLUDE when urlFilter matches but excludeDomain matches', () => {
        const rule = initRule({
          ...baseRule,
          condition: {
            urlFilter: '||example.com^',
            excludeDomain: ['api.example.com'],
          },
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/path'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://api.example.com/path'),
          IS_MATCH.MATCH_BUT_EXCLUDE,
        );
      });
    });

    describe('old format (rule.matchType)', () => {
      it('should match regexp type', () => {
        const rule = initRule(
          {
            ...baseRule,
            matchType: 'regexp',
            pattern: '^https://example\\.com/\\d+$',
          },
          true,
        ); // force web_request to compile regex
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/123'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/abc'),
          IS_MATCH.NOT_MATCH,
        );
      });

      it('should match prefix type', () => {
        const rule = initRule({
          ...baseRule,
          matchType: 'prefix',
          pattern: 'https://example.com/api',
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/api/users'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/other'),
          IS_MATCH.NOT_MATCH,
        );
      });

      it('should match domain type', () => {
        const rule = initRule({
          ...baseRule,
          matchType: 'domain',
          pattern: 'example.com',
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/path'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://sub.example.com/path'),
          IS_MATCH.NOT_MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://other.com/path'),
          IS_MATCH.NOT_MATCH,
        );
      });

      it('should match url type (exact match)', () => {
        const rule = initRule({
          ...baseRule,
          matchType: 'url',
          pattern: 'https://example.com/exact',
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/exact'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/exact/'),
          IS_MATCH.NOT_MATCH,
        );
      });

      it('should exclude with regex exclude pattern', () => {
        const rule = initRule({
          ...baseRule,
          matchType: 'domain',
          pattern: 'example.com',
          exclude: '/api/private',
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/api/public'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/api/private/data'),
          IS_MATCH.MATCH_BUT_EXCLUDE,
        );
      });
    });

    describe('edge cases', () => {
      it('should match regardless of enable flag (enable is checked externally)', () => {
        const rule = initRule({
          ...baseRule,
          enable: false,
          condition: { url: 'https://example.com' },
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com'),
          IS_MATCH.MATCH,
        );
      });

      it('should handle file: URLs in domain matching', () => {
        const rule = initRule({
          ...baseRule,
          condition: { domain: ['example.com'] },
        });
        assert.strictEqual(
          isMatchUrl(rule, 'file:///path/to/file'),
          IS_MATCH.NOT_MATCH,
        );
      });

      it('should match all when condition.all is true', () => {
        const rule = initRule({
          ...baseRule,
          condition: { all: true },
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/path'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://any.com/any'),
          IS_MATCH.MATCH,
        );
      });

      it('should handle urlFilter with wildcards', () => {
        const rule = initRule({
          ...baseRule,
          condition: { urlFilter: '||example.com/api/*/private' },
        });
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/api/v1/private'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/api/v2/private/data'),
          IS_MATCH.MATCH,
        );
        assert.strictEqual(
          isMatchUrl(rule, 'https://example.com/api/public'),
          IS_MATCH.NOT_MATCH,
        );
      });
    });
  });
});
