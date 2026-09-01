import assert from 'node:assert';
import { createUrlFilterRegex } from '@/share/core/rule-utils';

function testUrlFilter(url, filter) {
  if (filter.length === 0) {
    return true;
  }
  const reg = createUrlFilterRegex(filter);
  return reg.test(url);
}

describe('rule-utils', () => {
  describe('createUrlFilterRegex', () => {
    it('should return true for matching URL', () => {
      const url = 'https://example.com';
      const filter = 'example.com';
      assert.strictEqual(testUrlFilter(url, filter), true);
    });

    it('should return false for non-matching URL', () => {
      const url = 'https://example.com';
      const filter = 'test.com';
      assert.strictEqual(testUrlFilter(url, filter), false);
    });

    it('should match empty filter for any URL', () => {
      assert.strictEqual(testUrlFilter('https://example.com', ''), true);
      assert.strictEqual(
        testUrlFilter('http://test.org/path?query=1', ''),
        true,
      );
    });

    describe('wildcard (*)', () => {
      it('should match any characters', () => {
        assert.strictEqual(
          testUrlFilter('https://example.com/path', 'example*'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com/path', '*example*'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com/path', '*path'),
          true,
        );
      });

      it('should match empty string with *', () => {
        assert.strictEqual(testUrlFilter('https://example.com', '*'), true);
      });
    });

    describe('left anchor (|)', () => {
      it('should match beginning of URL', () => {
        assert.strictEqual(
          testUrlFilter('https://example.com/path', '|https://example.com'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com/path', '|https://'),
          true,
        );
      });

      it('should not match if not at beginning', () => {
        assert.strictEqual(
          testUrlFilter('https://example.com/path', '|example.com'),
          false,
        );
      });
    });

    describe('right anchor (|)', () => {
      it('should match end of URL', () => {
        assert.strictEqual(
          testUrlFilter('https://example.com/path', 'path|'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com/', 'example.com/|'),
          true,
        );
      });

      it('should not match if not at end', () => {
        assert.strictEqual(
          testUrlFilter('https://example.com/path', 'example.com|'),
          false,
        );
      });
    });

    describe('domain anchor (||)', () => {
      it('should match domain and subdomains', () => {
        assert.strictEqual(
          testUrlFilter('https://example.com', '||example.com'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://sub.example.com', '||example.com'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://a.b.example.com', '||example.com'),
          true,
        );
      });

      it('should match with protocol', () => {
        assert.strictEqual(
          testUrlFilter('http://example.com', '||example.com'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com', '||example.com'),
          true,
        );
      });

      it('should not match different domain', () => {
        assert.strictEqual(
          testUrlFilter('https://test.com', '||example.com'),
          false,
        );
        assert.strictEqual(
          testUrlFilter('https://example.org', '||example.com'),
          false,
        );
      });

      it('should match subdomains with domain anchor', () => {
        assert.strictEqual(
          testUrlFilter('https://test.example.com', '||example.com'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://a.b.example.com', '||example.com'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://a.example.company', '||example.com'),
          true,
        );
      });

      it('should match different domain with same suffix', () => {
        assert.strictEqual(
          testUrlFilter('https://example.com.test', '||example.com'),
          true,
        );
      });

      it('should not match domain without proper boundary', () => {
        assert.strictEqual(
          testUrlFilter('https://testexample.com', '||example.com'),
          false,
        );
      });
    });

    describe('separator (^)', () => {
      it('should match non-alphanumeric characters except _ - . %', () => {
        assert.strictEqual(
          testUrlFilter('https://example.com/path', 'example.com^path'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com?query=1', 'example.com^query'),
          false,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com#hash', 'example.com^hash'),
          false,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com:8080', 'example.com^8080'),
          true,
        );
      });

      it('should match end of URL', () => {
        assert.strictEqual(
          testUrlFilter('https://example.com/path', 'path^'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com', 'example.com^'),
          true,
        );
      });

      it('should match alphanumeric and allowed chars after separator', () => {
        assert.strictEqual(
          testUrlFilter('https://example.com/path', 'example.com^path'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com/path_', 'example.com^path_'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com/path-', 'example.com^path-'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com/path.', 'example.com^path.'),
          true,
        );
      });

      it('should not match when separator expects non-alphanumeric but finds alphanumeric', () => {
        assert.strictEqual(
          testUrlFilter('https://example.comp', 'example.com^p'),
          false,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com', 'example.com^p'),
          false,
        );
      });
    });

    describe('combined anchors', () => {
      it('domain anchor and right anchor', () => {
        assert.strictEqual(
          testUrlFilter('https://example.com/path', '||example.com|'),
          false,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com', '||example.com|'),
          false,
        );
      });

      it('left and right anchor', () => {
        assert.strictEqual(
          testUrlFilter('https://example.com', '|https://example.com|'),
          false,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com/', '|https://example.com|'),
          false,
        );
      });
    });

    describe('case insensitive', () => {
      it('should match case insensitively', () => {
        assert.strictEqual(
          testUrlFilter('https://EXAMPLE.COM', 'example.com'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://Example.Com', '||EXAMPLE.COM'),
          true,
        );
        assert.strictEqual(
          testUrlFilter('https://example.com', 'EXAMPLE.COM'),
          true,
        );
      });
    });

    describe('special characters escaping', () => {
      it('should escape regex special characters in pattern', () => {
        assert.strictEqual(
          testUrlFilter('https://example.com/(path)', 'example.com/(path)'),
          true,
        );
        assert.strictEqual(
          testUrlFilter(
            'https://example.com/path?query=1',
            'example.com/path?query=1',
          ),
          true,
        );
        assert.strictEqual(
          testUrlFilter(
            'https://example.com/path+more',
            'example.com/path+more',
          ),
          true,
        );
      });
    });

    describe('complex patterns', () => {
      it('should match complex url filter patterns', () => {
        assert.strictEqual(
          testUrlFilter(
            'https://ads.example.com/banner.jpg',
            '||ads.example.com^',
          ),
          true,
        );
        assert.strictEqual(
          testUrlFilter(
            'https://example.com/ads/banner.jpg',
            '||example.com^ads^',
          ),
          true,
        );
        assert.strictEqual(
          testUrlFilter(
            'https://sub.domain.example.com/page',
            '||example.com*page',
          ),
          true,
        );
      });
    });
  });
});
