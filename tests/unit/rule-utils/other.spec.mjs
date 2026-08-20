import assert from 'node:assert';
import { RULE_TYPE } from '@/share/core/constant';
import { detectRunner, initRule } from '@/share/core/rule-utils';

describe('rule-utils', () => {
  describe('detectRunner', () => {
    const baseRule = {
      enable: true,
      name: 'test',
      ruleType: RULE_TYPE.MODIFY_SEND_HEADER,
      isFunction: false,
      code: '',
      group: 'default',
      condition: undefined,
    };

    it('should return forced web_request when forceRunner is web_request and ENABLE_WEB_REQUEST is true', () => {
      const rule = { ...baseRule, forceRunner: 'web_request' };
      assert.strictEqual(detectRunner(rule), 'web_request');
    });

    it('should return forced dnr when forceRunner is dnr and ENABLE_DNR is true', () => {
      const rule = { ...baseRule, forceRunner: 'dnr' };
      assert.strictEqual(detectRunner(rule), 'dnr');
    });

    it('should return dnr when forceRunner is web_request but ENABLE_WEB_REQUEST is false', () => {
      globalThis.ENABLE_WEB_REQUEST = false;
      const rule = { ...baseRule, forceRunner: 'web_request' };
      assert.strictEqual(detectRunner(rule), 'dnr');
      globalThis.ENABLE_WEB_REQUEST = true;
    });

    it('should return dnr when forceRunner is dnr even if ENABLE_DNR is false (fallback happens in initRule)', () => {
      globalThis.ENABLE_DNR = false;
      const rule = { ...baseRule, forceRunner: 'dnr' };
      assert.strictEqual(detectRunner(rule), 'dnr');
      globalThis.ENABLE_DNR = true;
    });

    it('should ignore forceRunner when set to auto', () => {
      const rule = { ...baseRule, forceRunner: 'auto' };
      assert.strictEqual(detectRunner(rule), 'dnr');
    });

    it('should return web_request when isFunction is true', () => {
      const rule = { ...baseRule, isFunction: true };
      assert.strictEqual(detectRunner(rule), 'web_request');
    });

    it('should return web_request when exclude is set (old format)', () => {
      const rule = { ...baseRule, exclude: '/api/private' };
      assert.strictEqual(detectRunner(rule), 'web_request');
    });

    it('should return web_request when condition.excludeRegex is set', () => {
      const rule = { ...baseRule, condition: { excludeRegex: '/api/private' } };
      assert.strictEqual(detectRunner(rule), 'web_request');
    });

    it('should return web_request when ruleType is MODIFY_RECV_BODY', () => {
      const rule = { ...baseRule, ruleType: RULE_TYPE.MODIFY_RECV_BODY };
      assert.strictEqual(detectRunner(rule), 'web_request');
    });

    it('should return dnr for normal rule without special conditions', () => {
      const rule = { ...baseRule };
      assert.strictEqual(detectRunner(rule), 'dnr');
    });

    it('should return dnr when condition has urlFilter but no excludeRegex', () => {
      const rule = { ...baseRule, condition: { urlFilter: '||example.com^' } };
      assert.strictEqual(detectRunner(rule), 'dnr');
    });

    it('should return dnr when condition has regex but no excludeRegex', () => {
      const rule = {
        ...baseRule,
        condition: { regex: '^https://example\\.com/' },
      };
      assert.strictEqual(detectRunner(rule), 'dnr');
    });

    it('should return dnr when condition has domain', () => {
      const rule = { ...baseRule, condition: { domain: ['example.com'] } };
      assert.strictEqual(detectRunner(rule), 'dnr');
    });
  });

  describe('initRule', () => {
    const baseRule = {
      enable: true,
      name: 'test',
      ruleType: RULE_TYPE.MODIFY_SEND_HEADER,
      isFunction: false,
      code: '',
      group: 'default',
    };

    it('should initialize _runner using detectRunner', () => {
      const rule = initRule({ ...baseRule, forceRunner: 'web_request' });
      assert.strictEqual(rule._runner, 'web_request');
    });

    it('should fallback to web_request when DNR is disabled and runner is dnr', () => {
      globalThis.ENABLE_DNR = false;
      const rule = initRule({ ...baseRule, forceRunner: 'dnr' });
      assert.strictEqual(rule._runner, 'web_request');
      globalThis.ENABLE_DNR = true;
    });

    it('should create _func when isFunction is true and runner is web_request', () => {
      const rule = initRule({
        ...baseRule,
        isFunction: true,
        code: 'return val + JSON.stringify(detail);',
        forceRunner: 'web_request',
      });
      assert.ok(typeof rule._func === 'function');
      const result = rule._func('test', { url: 'https://example.com' });
      assert.ok(result.includes('test'));
      assert.ok(result.includes('url'));
      assert.ok(result.includes('https://example.com'));
    });

    it('should not create _func when runner is dnr (no forceUseWebRequest)', () => {
      // When isFunction is true, detectRunner returns web_request
      // So we test with a normal rule (isFunction: false) that gets dnr runner
      const rule = initRule({
        ...baseRule,
        isFunction: false,
        code: 'return val;',
      });
      // Since runner is dnr and no forceUseWebRequest, _func should not be created
      assert.strictEqual(rule._func, undefined);
    });

    it('should create _filter_reg from condition.urlFilter when using web_request runner', () => {
      const rule = initRule(
        {
          ...baseRule,
          condition: { urlFilter: '||example.com^' },
        },
        true,
      ); // forceUseWebRequest = true
      assert.ok(rule._filter_reg instanceof RegExp);
      assert.ok(rule._filter_reg.test('https://example.com/path'));
      assert.ok(!rule._filter_reg.test('https://other.com/path'));
    });

    it('should create _reg from condition.regex when using web_request runner', () => {
      const rule = initRule(
        {
          ...baseRule,
          condition: { regex: '^https://example\\.com/\\d+$' },
        },
        true,
      ); // forceUseWebRequest = true
      assert.ok(rule._reg instanceof RegExp);
      assert.ok(rule._reg.test('https://example.com/123'));
      assert.ok(!rule._reg.test('https://example.com/abc'));
    });

    it('should create _exclude from condition.excludeRegex', () => {
      const rule = initRule({
        ...baseRule,
        condition: {
          urlPrefix: 'https://example.com/',
          excludeRegex: '/api/private',
        },
      });
      assert.ok(rule._exclude instanceof RegExp);
      assert.ok(rule._exclude.test('/api/private/data'));
      assert.ok(!rule._exclude.test('/api/public'));
    });

    it('should create _reg from matchType regexp (old format)', () => {
      const rule = initRule(
        {
          ...baseRule,
          matchType: 'regexp',
          pattern: '^https://example\\.com/\\d+$',
        },
        true,
      );
      assert.ok(rule._reg instanceof RegExp);
      assert.ok(rule._reg.test('https://example.com/123'));
      assert.ok(!rule._reg.test('https://example.com/abc'));
    });

    it('should create _exclude from exclude string (old format)', () => {
      const rule = initRule({
        ...baseRule,
        matchType: 'domain',
        pattern: 'example.com',
        exclude: '/api/private',
      });
      assert.ok(rule._exclude instanceof RegExp);
      assert.ok(rule._exclude.test('/api/private/data'));
      assert.ok(!rule._exclude.test('/api/public'));
    });

    it('should not create _reg for non-regexp matchType', () => {
      const rule = initRule({
        ...baseRule,
        matchType: 'domain',
        pattern: 'example.com',
      });
      assert.strictEqual(rule._reg, undefined);
    });

    it('should respect forceUseWebRequest parameter', () => {
      const rule = initRule(
        {
          ...baseRule,
          isFunction: true,
          code: 'return val;',
        },
        true,
      );
      assert.ok(rule._func instanceof Function);
    });

    it('should initialize all regex properties when using condition format with forceUseWebRequest', () => {
      const rule = initRule(
        {
          ...baseRule,
          condition: {
            urlFilter: '||example.com^',
            regex: '^https://example\\.com/',
            excludeRegex: '/private',
          },
        },
        true,
      );
      assert.ok(rule._filter_reg instanceof RegExp);
      assert.ok(rule._reg instanceof RegExp);
      assert.ok(rule._exclude instanceof RegExp);
    });

    it('should handle rule with condition.all = true', () => {
      const rule = initRule({
        ...baseRule,
        condition: { all: true },
      });
      assert.strictEqual(rule._runner, 'dnr');
    });

    it('should copy all base rule properties', () => {
      const rule = initRule({
        ...baseRule,
        name: 'custom-name',
        ruleType: RULE_TYPE.MODIFY_RECV_HEADER,
        encoding: 'utf-8',
        headers: { 'x-custom': 'value' },
      });
      assert.strictEqual(rule.name, 'custom-name');
      assert.strictEqual(rule.ruleType, RULE_TYPE.MODIFY_RECV_HEADER);
      assert.strictEqual(rule.encoding, 'utf-8');
      assert.deepStrictEqual(rule.headers, { 'x-custom': 'value' });
    });
  });
});
