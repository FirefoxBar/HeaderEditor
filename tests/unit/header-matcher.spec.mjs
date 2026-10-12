import { strict as assert } from 'node:assert';
import { IS_MATCH } from '@/share/core/constant';
import { compileCondition, matchCondition } from '@/share/core/header-matcher';

/** ['A', '1'] -> { header: 'A', value: '1' } */
const H = (...pairs) => pairs.map(([name, value]) => ({ name, value }));

/** 编译 + 匹配一步到位，用于单条断言 */
const match = (condition, ...headers) =>
  matchCondition(compileCondition(condition), H(...headers));

describe('header-matcher', () => {
  describe('values：普通字符串精确匹配', () => {
    it('精确命中', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'A', values: ['1'] }] }, [
          'A',
          '1',
        ]),
        IS_MATCH.MATCH,
      );
    });

    it('精确不命中（子串不算命中）', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'A', values: ['1'] }] }, [
          'A',
          '11',
        ]),
        IS_MATCH.NOT_MATCH,
      );
    });

    it('值匹配大小写敏感', () => {
      assert.equal(
        match(
          {
            responseHeaders: [
              { header: 'Content-Type', values: ['TEXT/HTML'] },
            ],
          },
          ['Content-Type', 'text/html'],
        ),
        IS_MATCH.NOT_MATCH,
      );
    });

    it('字面值中的正则元字符不被当作正则', () => {
      // 'a.b' 只应匹配字面 'a.b'，不能匹配 'axb'
      assert.equal(
        match({ responseHeaders: [{ header: 'A', values: ['a.b'] }] }, [
          'A',
          'a.b',
        ]),
        IS_MATCH.MATCH,
      );
      assert.equal(
        match({ responseHeaders: [{ header: 'A', values: ['a.b'] }] }, [
          'A',
          'axb',
        ]),
        IS_MATCH.NOT_MATCH,
      );
    });

    it('header 不存在时不匹配', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X-Foo', values: ['1'] }] }, [
          'Content-Type',
          'text/html',
        ]),
        IS_MATCH.NOT_MATCH,
      );
    });

    it('header 存在但值为空字符串，仍按值比较', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X', values: [''] }] }, ['X', '']),
        IS_MATCH.MATCH,
      );
      assert.equal(
        match({ responseHeaders: [{ header: 'X', values: ['a'] }] }, ['X', '']),
        IS_MATCH.NOT_MATCH,
      );
    });
  });

  describe('values：通配符 *', () => {
    it('`*` 匹配任意字符串', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'A', values: ['*'] }] }, [
          'A',
          'anything',
        ]),
        IS_MATCH.MATCH,
      );
    });

    it('`*` 匹配空字符串', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'A', values: ['*'] }] }, ['A', '']),
        IS_MATCH.MATCH,
      );
    });

    it('前缀通配 `text/*`', () => {
      const cond = {
        responseHeaders: [{ header: 'Content-Type', values: ['text/*'] }],
      };
      assert.equal(match(cond, ['Content-Type', 'text/html']), IS_MATCH.MATCH);
      assert.equal(match(cond, ['Content-Type', 'text/plain']), IS_MATCH.MATCH);
      assert.equal(
        match(cond, ['Content-Type', 'application/json']),
        IS_MATCH.NOT_MATCH,
      );
    });

    it('后缀通配 `*/json`', () => {
      const cond = {
        responseHeaders: [{ header: 'Content-Type', values: ['*/json'] }],
      };
      assert.equal(
        match(cond, ['Content-Type', 'application/json']),
        IS_MATCH.MATCH,
      );
      assert.equal(
        match(cond, ['Content-Type', 'application/xml']),
        IS_MATCH.NOT_MATCH,
      );
    });

    it('中间通配 `v*2024`', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['v*2024'] }] };
      assert.equal(match(cond, ['X', 'v1.2-2024']), IS_MATCH.MATCH);
      assert.equal(match(cond, ['X', 'v2024']), IS_MATCH.MATCH); // * 可以匹配空
      assert.equal(match(cond, ['X', 'v1.2-2023']), IS_MATCH.NOT_MATCH);
    });

    it('多个 `*` 同时出现', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['a*b*c'] }] };
      assert.equal(match(cond, ['X', 'abc']), IS_MATCH.MATCH);
      assert.equal(match(cond, ['X', 'aXXbYYc']), IS_MATCH.MATCH);
      assert.equal(match(cond, ['X', 'ab']), IS_MATCH.NOT_MATCH);
    });

    it('通配符匹配整值，不做子串匹配', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['ab*'] }] };
      assert.equal(match(cond, ['X', 'abc']), IS_MATCH.MATCH);
      assert.equal(match(cond, ['X', 'xabc']), IS_MATCH.NOT_MATCH); // 前面多出内容不匹配
    });

    it('通配符大小写敏感', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X', values: ['text/*'] }] }, [
          'X',
          'TEXT/HTML',
        ]),
        IS_MATCH.NOT_MATCH,
      );
    });
  });

  describe('values：通配符 ?', () => {
    it('`?` 匹配单个字符', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['v?'] }] };
      assert.equal(match(cond, ['X', 'v1']), IS_MATCH.MATCH);
      assert.equal(match(cond, ['X', 'v12']), IS_MATCH.NOT_MATCH);
      assert.equal(match(cond, ['X', 'v']), IS_MATCH.NOT_MATCH);
    });

    it('多个 `?` 组合', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['??-??'] }] };
      assert.equal(match(cond, ['X', 'ab-cd']), IS_MATCH.MATCH);
      assert.equal(match(cond, ['X', 'a-cd']), IS_MATCH.NOT_MATCH);
    });

    it('`*` 与 `?` 混用', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['*-????'] }] };
      assert.equal(match(cond, ['X', 'release-2024']), IS_MATCH.MATCH);
      assert.equal(match(cond, ['X', 'release-24']), IS_MATCH.NOT_MATCH);
    });
  });

  describe('values：转义与特殊字符', () => {
    it('`\\*` 表示字面星号', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['a\\*'] }] };
      assert.equal(match(cond, ['X', 'a*']), IS_MATCH.MATCH);
      assert.equal(match(cond, ['X', 'abc']), IS_MATCH.NOT_MATCH);
    });

    it('`\\?` 表示字面问号', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['a\\?'] }] };
      assert.equal(match(cond, ['X', 'a?']), IS_MATCH.MATCH);
      assert.equal(match(cond, ['X', 'ab']), IS_MATCH.NOT_MATCH);
    });

    it('字面值含正则元字符组合仍按字面处理', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['(a)|[b]'] }] };
      assert.equal(match(cond, ['X', '(a)|[b]']), IS_MATCH.MATCH);
      assert.equal(match(cond, ['X', 'ab']), IS_MATCH.NOT_MATCH);
    });
  });

  describe('values：多项任一命中', () => {
    it('字面值与通配符混排', () => {
      const cond = {
        responseHeaders: [
          {
            header: 'Content-Type',
            values: ['text/html', '*/json', 'application/xml'],
          },
        ],
      };
      assert.equal(match(cond, ['Content-Type', 'text/html']), IS_MATCH.MATCH);
      assert.equal(
        match(cond, ['Content-Type', 'application/json']),
        IS_MATCH.MATCH,
      );
      assert.equal(
        match(cond, ['Content-Type', 'application/xml']),
        IS_MATCH.MATCH,
      );
      assert.equal(
        match(cond, ['Content-Type', 'text/css']),
        IS_MATCH.NOT_MATCH,
      );
    });

    it('多个通配符任一命中', () => {
      const cond = {
        responseHeaders: [{ header: 'X', values: ['foo*', '*bar'] }],
      };
      assert.equal(match(cond, ['X', 'foo123']), IS_MATCH.MATCH);
      assert.equal(match(cond, ['X', '123bar']), IS_MATCH.MATCH);
      assert.equal(match(cond, ['X', '123baz']), IS_MATCH.NOT_MATCH);
    });
  });

  describe('header 名大小写不敏感', () => {
    it('规则小写 / 响应大写', () => {
      assert.equal(
        match(
          {
            responseHeaders: [
              { header: 'content-type', values: ['text/html'] },
            ],
          },
          ['CONTENT-TYPE', 'text/html'],
        ),
        IS_MATCH.MATCH,
      );
    });

    it('规则大写 / 响应小写', () => {
      assert.equal(
        match(
          {
            responseHeaders: [
              { header: 'CONTENT-TYPE', values: ['text/html'] },
            ],
          },
          ['content-type', 'text/html'],
        ),
        IS_MATCH.MATCH,
      );
    });

    it('规则混合大小写 / 响应混合大小写', () => {
      assert.equal(
        match(
          { responseHeaders: [{ header: 'CoNtEnT-TyPe', values: ['text/*'] }] },
          ['cOnTeNt-tYpE', 'text/html'],
        ),
        IS_MATCH.MATCH,
      );
    });
  });

  describe('空规则（values 与 excludedValues 都为空）：存在即匹配', () => {
    it('header 存在即匹配', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X-Foo' }] }, [
          'X-Foo',
          'anything',
        ]),
        IS_MATCH.MATCH,
      );
    });

    it('header 存在且值为空字符串也算匹配', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X' }] }, ['X', '']),
        IS_MATCH.MATCH,
      );
    });

    it('header 不存在则不匹配', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X-Foo' }] }, [
          'Content-Type',
          'text/html',
        ]),
        IS_MATCH.NOT_MATCH,
      );
    });

    it('values 为空数组等同于未设置', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X', values: [] }] }, ['X', 'any']),
        IS_MATCH.MATCH,
      );
      assert.equal(
        match({ responseHeaders: [{ header: 'X', values: [] }] }, ['Y', 'any']),
        IS_MATCH.NOT_MATCH,
      );
    });

    it('values 与 excludedValues 都为空数组，仍为存在即匹配', () => {
      assert.equal(
        match(
          {
            responseHeaders: [{ header: 'X', values: [], excludedValues: [] }],
          },
          ['X', 'any'],
        ),
        IS_MATCH.MATCH,
      );
    });
  });

  describe('excludedValues：命中即失败', () => {
    it('字面值命中 excludedValues 时失败', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X', excludedValues: ['bad'] }] }, [
          'X',
          'bad',
        ]),
        IS_MATCH.EXCLUDE,
      );
    });

    it('通配符命中 excludedValues 时失败', () => {
      const cond = {
        responseHeaders: [{ header: 'X', excludedValues: ['*bad*'] }],
      };
      assert.equal(match(cond, ['X', 'very-bad-value']), IS_MATCH.EXCLUDE);
      assert.equal(match(cond, ['X', 'good-value']), IS_MATCH.MATCH);
    });

    it('未命中 excludedValues 且无 values 时匹配', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X', excludedValues: ['bad'] }] }, [
          'X',
          'good',
        ]),
        IS_MATCH.MATCH,
      );
    });

    it('header 不存在时不匹配（即使只有 excludedValues）', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X', excludedValues: ['bad'] }] }, [
          'Y',
          'good',
        ]),
        IS_MATCH.NOT_MATCH,
      );
    });

    it('多值 header 中任一值命中 excludedValues 即失败', () => {
      const cond = {
        responseHeaders: [{ header: 'X', excludedValues: ['bad'] }],
      };
      assert.equal(
        matchCondition(compileCondition(cond), H(['X', 'ok1'], ['X', 'bad'])),
        IS_MATCH.EXCLUDE,
      );
    });

    it('多个 excludedValues（含通配符）任一命中即失败', () => {
      const cond = {
        responseHeaders: [{ header: 'X', excludedValues: ['no1', '*no2*'] }],
      };
      assert.equal(match(cond, ['X', 'yes']), IS_MATCH.MATCH);
      assert.equal(match(cond, ['X', 'no1']), IS_MATCH.EXCLUDE);
      assert.equal(match(cond, ['X', 'xx-no2-xx']), IS_MATCH.EXCLUDE);
    });

    it('`?` 在 excludedValues 中生效', () => {
      const cond = {
        responseHeaders: [{ header: 'X', excludedValues: ['err?'] }],
      };
      assert.equal(match(cond, ['X', 'err1']), IS_MATCH.EXCLUDE);
      assert.equal(match(cond, ['X', 'err12']), IS_MATCH.MATCH);
    });
  });

  describe('values + excludedValues 组合：排除优先', () => {
    const cond = {
      responseHeaders: [
        {
          header: 'Content-Type',
          values: ['text/*'],
          excludedValues: ['text/plain'],
        },
      ],
    };

    it('两者都命中时以排除为准', () => {
      assert.equal(
        match(cond, ['Content-Type', 'text/plain']),
        IS_MATCH.EXCLUDE,
      );
    });

    it('values 命中且 excludedValues 未命中时成功', () => {
      assert.equal(match(cond, ['Content-Type', 'text/html']), IS_MATCH.MATCH);
    });

    it('values 未命中时失败（即使 excludedValues 也未命中）', () => {
      assert.equal(
        match(cond, ['Content-Type', 'application/json']),
        IS_MATCH.NOT_MATCH,
      );
    });

    it('excludedValues 用通配符排除一类值', () => {
      const c = {
        responseHeaders: [
          { header: 'Content-Type', values: ['*'], excludedValues: ['text/*'] },
        ],
      };
      assert.equal(
        match(c, ['Content-Type', 'application/json']),
        IS_MATCH.MATCH,
      );
      assert.equal(match(c, ['Content-Type', 'text/html']), IS_MATCH.EXCLUDE);
    });
  });

  describe('同组内多个 HeaderMatchInfo：全部命中才算命中', () => {
    it('全部命中 → 成功', () => {
      const cond = {
        responseHeaders: [
          { header: 'A', values: ['1'] },
          { header: 'B', values: ['x*'] },
        ],
      };
      assert.equal(match(cond, ['A', '1'], ['B', 'xyz']), IS_MATCH.MATCH);
    });

    it('其一未命中 → 失败', () => {
      const cond = {
        responseHeaders: [
          { header: 'A', values: ['1'] },
          { header: 'B', values: ['x*'] },
        ],
      };
      assert.equal(match(cond, ['A', '1'], ['B', 'abc']), IS_MATCH.NOT_MATCH);
    });

    it('其一 header 缺失 → 失败', () => {
      const cond = {
        responseHeaders: [{ header: 'A', values: ['1'] }, { header: 'B' }],
      };
      assert.equal(match(cond, ['A', '1']), IS_MATCH.NOT_MATCH);
    });

    it('空数组视为无约束 → 成功', () => {
      assert.equal(match({ responseHeaders: [] }, ['A', '1']), IS_MATCH.MATCH);
    });
  });

  describe('excludeResponseHeaders 优先级高于 responseHeaders', () => {
    it('exclude 命中时整条规则不匹配（即使 include 也命中）', () => {
      const cond = {
        responseHeaders: [{ header: 'A', values: ['1'] }],
        excludeResponseHeaders: [{ header: 'A', values: ['1'] }],
      };
      assert.equal(match(cond, ['A', '1']), IS_MATCH.EXCLUDE);
    });

    it('exclude 未命中时按 include 结果判定', () => {
      const cond = {
        responseHeaders: [{ header: 'A', values: ['1'] }],
        excludeResponseHeaders: [{ header: 'A', values: ['2'] }],
      };
      assert.equal(match(cond, ['A', '1']), IS_MATCH.MATCH);
    });

    it('exclude 命中且 include 未命中时仍不匹配', () => {
      const cond = {
        responseHeaders: [{ header: 'A', values: ['9'] }],
        excludeResponseHeaders: [{ header: 'A', values: ['1'] }],
      };
      assert.equal(match(cond, ['A', '1']), IS_MATCH.NOT_MATCH);
    });

    it('exclude 为空数组时不生效', () => {
      const cond = {
        responseHeaders: [{ header: 'A', values: ['1'] }],
        excludeResponseHeaders: [],
      };
      assert.equal(match(cond, ['A', '1']), IS_MATCH.MATCH);
    });

    it('exclude 使用空规则（存在即排除）', () => {
      assert.equal(
        match({ excludeResponseHeaders: [{ header: 'A' }] }, ['A', '1']),
        IS_MATCH.EXCLUDE,
      );
      assert.equal(
        match({ excludeResponseHeaders: [{ header: 'A' }] }, ['B', '1']),
        IS_MATCH.MATCH,
      );
    });

    it('exclude 使用通配符', () => {
      const cond = {
        excludeResponseHeaders: [{ header: 'X', values: ['*debug*'] }],
      };
      assert.equal(match(cond, ['X', 'a-debug-b']), IS_MATCH.EXCLUDE);
      assert.equal(match(cond, ['X', 'a-release-b']), IS_MATCH.MATCH);
    });

    it('exclude 使用 excludedValues 语义：未命中即排除', () => {
      const cond = {
        excludeResponseHeaders: [{ header: 'A', excludedValues: ['keep'] }],
      };
      assert.equal(match(cond, ['A', 'drop-me']), IS_MATCH.EXCLUDE);
      assert.equal(match(cond, ['A', 'keep']), IS_MATCH.MATCH);
    });

    it('exclude 组内多条需全部命中才触发排除', () => {
      const cond = {
        excludeResponseHeaders: [{ header: 'A' }, { header: 'B' }],
      };
      assert.equal(match(cond, ['A', '1'], ['B', '2']), IS_MATCH.EXCLUDE); // 全部命中 → 排除
      assert.equal(match(cond, ['A', '1']), IS_MATCH.MATCH); // 只命中一条 → 不排除
    });

    it('空 Condition 匹配任意响应头', () => {
      assert.equal(match({}, ['A', '1']), IS_MATCH.MATCH);
      assert.equal(match({}), IS_MATCH.MATCH);
    });

    it('只有 exclude 且未命中时匹配成功', () => {
      assert.equal(
        match({ excludeResponseHeaders: [{ header: 'A', values: ['1'] }] }, [
          'A',
          '2',
        ]),
        IS_MATCH.MATCH,
      );
      assert.equal(
        match({ excludeResponseHeaders: [{ header: 'A', values: ['1'] }] }, [
          'B',
          '1',
        ]),
        IS_MATCH.MATCH,
      );
    });
  });

  describe('同名多值 header', () => {
    it('任一值命中 values 即成功', () => {
      const cond = {
        responseHeaders: [{ header: 'Set-Cookie', values: ['bbb'] }],
      };
      assert.equal(
        matchCondition(
          compileCondition(cond),
          H(['Set-Cookie', 'aaa'], ['Set-Cookie', 'bbb']),
        ),
        IS_MATCH.MATCH,
      );
    });

    it('任一值命中通配符即成功', () => {
      const cond = {
        responseHeaders: [{ header: 'Set-Cookie', values: ['session=*'] }],
      };
      assert.equal(
        matchCondition(
          compileCondition(cond),
          H(['Set-Cookie', 'a=1'], ['Set-Cookie', 'session=xyz']),
        ),
        IS_MATCH.MATCH,
      );
    });

    it('所有值都不命中则失败', () => {
      const cond = {
        responseHeaders: [{ header: 'Set-Cookie', values: ['ccc'] }],
      };
      assert.equal(
        matchCondition(
          compileCondition(cond),
          H(['Set-Cookie', 'aaa'], ['Set-Cookie', 'bbb']),
        ),
        IS_MATCH.NOT_MATCH,
      );
    });

    it('所有值都被 excludedValues 排除后失败', () => {
      const cond = {
        responseHeaders: [{ header: 'X', excludedValues: ['bad*'] }],
      };
      assert.equal(
        matchCondition(
          compileCondition(cond),
          H(['X', 'bad-1'], ['X', 'bad-2']),
        ),
        IS_MATCH.EXCLUDE,
      );
    });
  });

  describe('预处理 / 复用相关', () => {
    it('一次编译可重复用于多个请求且结果互不影响', () => {
      const compiled = compileCondition({
        responseHeaders: [{ header: 'A', values: ['1', 'x*'] }],
      });
      assert.equal(matchCondition(compiled, H(['A', '1'])), IS_MATCH.MATCH);
      assert.equal(matchCondition(compiled, H(['A', '2'])), IS_MATCH.NOT_MATCH);
      assert.equal(matchCondition(compiled, H(['A', 'xyz'])), IS_MATCH.MATCH);
      assert.equal(matchCondition(compiled, H()), IS_MATCH.NOT_MATCH);
    });

    it('通配符编译成的正则不带 g/y 标志，复用结果稳定', () => {
      const compiled = compileCondition({
        responseHeaders: [{ header: 'A', values: ['a*'] }],
      });
      assert.equal(matchCondition(compiled, H(['A', 'ab'])), IS_MATCH.MATCH);
      assert.equal(matchCondition(compiled, H(['A', 'ab'])), IS_MATCH.MATCH);
      assert.equal(matchCondition(compiled, H(['A', 'ab'])), IS_MATCH.MATCH);
    });

    it('headerIndex 只包含规则中出现的 header，且键为小写', () => {
      const compiled = compileCondition({
        responseHeaders: [{ header: 'Content-Type', values: ['text/html'] }],
        excludeResponseHeaders: [{ header: 'X-BLOCK' }],
      });
      assert.deepEqual([...compiled.headerIndex.keys()].sort(), [
        'content-type',
        'x-block',
      ]);
      assert.equal(compiled.headerIndex.size, 2);
    });

    it('编译不修改传入的 Condition 对象', () => {
      const cond = { responseHeaders: [{ header: 'A', values: ['x*'] }] };
      const snapshot = JSON.stringify(cond);
      compileCondition(cond);
      assert.equal(JSON.stringify(cond), snapshot);
    });

    it('匹配过程不修改传入的响应头数组', () => {
      const headers = H(['A', '1'], ['B', '2']);
      const snapshot = JSON.stringify(headers);
      matchCondition(
        compileCondition({ responseHeaders: [{ header: 'A', values: ['1'] }] }),
        headers,
      );
      assert.equal(JSON.stringify(headers), snapshot);
    });
  });

  describe('边界情况', () => {
    it('空响应头数组 + 非空规则 → 失败', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'A' }] }),
        IS_MATCH.NOT_MATCH,
      );
    });

    it('空响应头数组 + 空规则 → 成功', () => {
      assert.equal(match({}), IS_MATCH.MATCH);
    });

    it('响应头中存在规则未涉及的 header 不影响判定', () => {
      const cond = { responseHeaders: [{ header: 'A', values: ['*'] }] };
      assert.equal(
        match(cond, ['X-Irrelevant', 'x'], ['A', '1'], ['Y-Irrelevant', 'y']),
        IS_MATCH.MATCH,
      );
    });

    it('多条规则引用同一个 header', () => {
      const cond = {
        responseHeaders: [
          { header: 'A', values: ['x*'] },
          { header: 'A', excludedValues: ['xy'] },
        ],
      };
      assert.equal(match(cond, ['A', 'xa']), IS_MATCH.MATCH);
      assert.equal(match(cond, ['A', 'xy']), IS_MATCH.EXCLUDE);
    });

    it('真实场景：Content-Type 命中 + 排除健康检查路径', () => {
      const cond = {
        responseHeaders: [
          { header: 'Content-Type', values: ['text/*', '*/json'] },
          { header: 'X-Service', excludedValues: ['health*'] },
        ],
      };
      assert.equal(
        match(
          cond,
          ['Content-Type', 'application/json'],
          ['X-Service', 'order-api'],
        ),
        IS_MATCH.MATCH,
      );
      assert.equal(
        match(
          cond,
          ['Content-Type', 'text/html'],
          ['X-Service', 'health-check'],
        ),
        IS_MATCH.EXCLUDE,
      );
      assert.equal(
        match(cond, ['Content-Type', 'image/png'], ['X-Service', 'order-api']),
        IS_MATCH.NOT_MATCH,
      );
    });
  });
});
