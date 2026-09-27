import { strict as assert } from 'node:assert';
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
        true,
      );
    });

    it('精确不命中（子串不算命中）', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'A', values: ['1'] }] }, [
          'A',
          '11',
        ]),
        false,
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
        false,
      );
    });

    it('字面值中的正则元字符不被当作正则', () => {
      // 'a.b' 只应匹配字面 'a.b'，不能匹配 'axb'
      assert.equal(
        match({ responseHeaders: [{ header: 'A', values: ['a.b'] }] }, [
          'A',
          'a.b',
        ]),
        true,
      );
      assert.equal(
        match({ responseHeaders: [{ header: 'A', values: ['a.b'] }] }, [
          'A',
          'axb',
        ]),
        false,
      );
    });

    it('header 不存在时不匹配', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X-Foo', values: ['1'] }] }, [
          'Content-Type',
          'text/html',
        ]),
        false,
      );
    });

    it('header 存在但值为空字符串，仍按值比较', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X', values: [''] }] }, ['X', '']),
        true,
      );
      assert.equal(
        match({ responseHeaders: [{ header: 'X', values: ['a'] }] }, ['X', '']),
        false,
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
        true,
      );
    });

    it('`*` 匹配空字符串', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'A', values: ['*'] }] }, ['A', '']),
        true,
      );
    });

    it('前缀通配 `text/*`', () => {
      const cond = {
        responseHeaders: [{ header: 'Content-Type', values: ['text/*'] }],
      };
      assert.equal(match(cond, ['Content-Type', 'text/html']), true);
      assert.equal(match(cond, ['Content-Type', 'text/plain']), true);
      assert.equal(match(cond, ['Content-Type', 'application/json']), false);
    });

    it('后缀通配 `*/json`', () => {
      const cond = {
        responseHeaders: [{ header: 'Content-Type', values: ['*/json'] }],
      };
      assert.equal(match(cond, ['Content-Type', 'application/json']), true);
      assert.equal(match(cond, ['Content-Type', 'application/xml']), false);
    });

    it('中间通配 `v*2024`', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['v*2024'] }] };
      assert.equal(match(cond, ['X', 'v1.2-2024']), true);
      assert.equal(match(cond, ['X', 'v2024']), true); // * 可以匹配空
      assert.equal(match(cond, ['X', 'v1.2-2023']), false);
    });

    it('多个 `*` 同时出现', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['a*b*c'] }] };
      assert.equal(match(cond, ['X', 'abc']), true);
      assert.equal(match(cond, ['X', 'aXXbYYc']), true);
      assert.equal(match(cond, ['X', 'ab']), false);
    });

    it('通配符匹配整值，不做子串匹配', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['ab*'] }] };
      assert.equal(match(cond, ['X', 'abc']), true);
      assert.equal(match(cond, ['X', 'xabc']), false); // 前面多出内容不匹配
    });

    it('通配符大小写敏感', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X', values: ['text/*'] }] }, [
          'X',
          'TEXT/HTML',
        ]),
        false,
      );
    });
  });

  describe('values：通配符 ?', () => {
    it('`?` 匹配单个字符', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['v?'] }] };
      assert.equal(match(cond, ['X', 'v1']), true);
      assert.equal(match(cond, ['X', 'v12']), false);
      assert.equal(match(cond, ['X', 'v']), false);
    });

    it('多个 `?` 组合', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['??-??'] }] };
      assert.equal(match(cond, ['X', 'ab-cd']), true);
      assert.equal(match(cond, ['X', 'a-cd']), false);
    });

    it('`*` 与 `?` 混用', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['*-????'] }] };
      assert.equal(match(cond, ['X', 'release-2024']), true);
      assert.equal(match(cond, ['X', 'release-24']), false);
    });
  });

  describe('values：转义与特殊字符', () => {
    it('`\\*` 表示字面星号', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['a\\*'] }] };
      assert.equal(match(cond, ['X', 'a*']), true);
      assert.equal(match(cond, ['X', 'abc']), false);
    });

    it('`\\?` 表示字面问号', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['a\\?'] }] };
      assert.equal(match(cond, ['X', 'a?']), true);
      assert.equal(match(cond, ['X', 'ab']), false);
    });

    it('字面值含正则元字符组合仍按字面处理', () => {
      const cond = { responseHeaders: [{ header: 'X', values: ['(a)|[b]'] }] };
      assert.equal(match(cond, ['X', '(a)|[b]']), true);
      assert.equal(match(cond, ['X', 'ab']), false);
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
      assert.equal(match(cond, ['Content-Type', 'text/html']), true);
      assert.equal(match(cond, ['Content-Type', 'application/json']), true);
      assert.equal(match(cond, ['Content-Type', 'application/xml']), true);
      assert.equal(match(cond, ['Content-Type', 'text/css']), false);
    });

    it('多个通配符任一命中', () => {
      const cond = {
        responseHeaders: [{ header: 'X', values: ['foo*', '*bar'] }],
      };
      assert.equal(match(cond, ['X', 'foo123']), true);
      assert.equal(match(cond, ['X', '123bar']), true);
      assert.equal(match(cond, ['X', '123baz']), false);
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
        true,
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
        true,
      );
    });

    it('规则混合大小写 / 响应混合大小写', () => {
      assert.equal(
        match(
          { responseHeaders: [{ header: 'CoNtEnT-TyPe', values: ['text/*'] }] },
          ['cOnTeNt-tYpE', 'text/html'],
        ),
        true,
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
        true,
      );
    });

    it('header 存在且值为空字符串也算匹配', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X' }] }, ['X', '']),
        true,
      );
    });

    it('header 不存在则不匹配', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X-Foo' }] }, [
          'Content-Type',
          'text/html',
        ]),
        false,
      );
    });

    it('values 为空数组等同于未设置', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X', values: [] }] }, ['X', 'any']),
        true,
      );
      assert.equal(
        match({ responseHeaders: [{ header: 'X', values: [] }] }, ['Y', 'any']),
        false,
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
        true,
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
        false,
      );
    });

    it('通配符命中 excludedValues 时失败', () => {
      const cond = {
        responseHeaders: [{ header: 'X', excludedValues: ['*bad*'] }],
      };
      assert.equal(match(cond, ['X', 'very-bad-value']), false);
      assert.equal(match(cond, ['X', 'good-value']), true);
    });

    it('未命中 excludedValues 且无 values 时匹配', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X', excludedValues: ['bad'] }] }, [
          'X',
          'good',
        ]),
        true,
      );
    });

    it('header 不存在时不匹配（即使只有 excludedValues）', () => {
      assert.equal(
        match({ responseHeaders: [{ header: 'X', excludedValues: ['bad'] }] }, [
          'Y',
          'good',
        ]),
        false,
      );
    });

    it('多值 header 中任一值命中 excludedValues 即失败', () => {
      const cond = {
        responseHeaders: [{ header: 'X', excludedValues: ['bad'] }],
      };
      assert.equal(
        matchCondition(compileCondition(cond), H(['X', 'ok1'], ['X', 'bad'])),
        false,
      );
    });

    it('多个 excludedValues（含通配符）任一命中即失败', () => {
      const cond = {
        responseHeaders: [{ header: 'X', excludedValues: ['no1', '*no2*'] }],
      };
      assert.equal(match(cond, ['X', 'yes']), true);
      assert.equal(match(cond, ['X', 'no1']), false);
      assert.equal(match(cond, ['X', 'xx-no2-xx']), false);
    });

    it('`?` 在 excludedValues 中生效', () => {
      const cond = {
        responseHeaders: [{ header: 'X', excludedValues: ['err?'] }],
      };
      assert.equal(match(cond, ['X', 'err1']), false);
      assert.equal(match(cond, ['X', 'err12']), true);
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
      assert.equal(match(cond, ['Content-Type', 'text/plain']), false);
    });

    it('values 命中且 excludedValues 未命中时成功', () => {
      assert.equal(match(cond, ['Content-Type', 'text/html']), true);
    });

    it('values 未命中时失败（即使 excludedValues 也未命中）', () => {
      assert.equal(match(cond, ['Content-Type', 'application/json']), false);
    });

    it('excludedValues 用通配符排除一类值', () => {
      const c = {
        responseHeaders: [
          { header: 'Content-Type', values: ['*'], excludedValues: ['text/*'] },
        ],
      };
      assert.equal(match(c, ['Content-Type', 'application/json']), true);
      assert.equal(match(c, ['Content-Type', 'text/html']), false);
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
      assert.equal(match(cond, ['A', '1'], ['B', 'xyz']), true);
    });

    it('其一未命中 → 失败', () => {
      const cond = {
        responseHeaders: [
          { header: 'A', values: ['1'] },
          { header: 'B', values: ['x*'] },
        ],
      };
      assert.equal(match(cond, ['A', '1'], ['B', 'abc']), false);
    });

    it('其一 header 缺失 → 失败', () => {
      const cond = {
        responseHeaders: [{ header: 'A', values: ['1'] }, { header: 'B' }],
      };
      assert.equal(match(cond, ['A', '1']), false);
    });

    it('空数组视为无约束 → 成功', () => {
      assert.equal(match({ responseHeaders: [] }, ['A', '1']), true);
    });
  });

  describe('excludeResponseHeaders 优先级高于 responseHeaders', () => {
    it('exclude 命中时整条规则不匹配（即使 include 也命中）', () => {
      const cond = {
        responseHeaders: [{ header: 'A', values: ['1'] }],
        excludeResponseHeaders: [{ header: 'A', values: ['1'] }],
      };
      assert.equal(match(cond, ['A', '1']), false);
    });

    it('exclude 未命中时按 include 结果判定', () => {
      const cond = {
        responseHeaders: [{ header: 'A', values: ['1'] }],
        excludeResponseHeaders: [{ header: 'A', values: ['2'] }],
      };
      assert.equal(match(cond, ['A', '1']), true);
    });

    it('exclude 命中且 include 未命中时仍不匹配', () => {
      const cond = {
        responseHeaders: [{ header: 'A', values: ['9'] }],
        excludeResponseHeaders: [{ header: 'A', values: ['1'] }],
      };
      assert.equal(match(cond, ['A', '1']), false);
    });

    it('exclude 为空数组时不生效', () => {
      const cond = {
        responseHeaders: [{ header: 'A', values: ['1'] }],
        excludeResponseHeaders: [],
      };
      assert.equal(match(cond, ['A', '1']), true);
    });

    it('exclude 使用空规则（存在即排除）', () => {
      assert.equal(
        match({ excludeResponseHeaders: [{ header: 'A' }] }, ['A', '1']),
        false,
      );
      assert.equal(
        match({ excludeResponseHeaders: [{ header: 'A' }] }, ['B', '1']),
        true,
      );
    });

    it('exclude 使用通配符', () => {
      const cond = {
        excludeResponseHeaders: [{ header: 'X', values: ['*debug*'] }],
      };
      assert.equal(match(cond, ['X', 'a-debug-b']), false);
      assert.equal(match(cond, ['X', 'a-release-b']), true);
    });

    it('exclude 使用 excludedValues 语义：未命中即排除', () => {
      const cond = {
        excludeResponseHeaders: [{ header: 'A', excludedValues: ['keep'] }],
      };
      assert.equal(match(cond, ['A', 'drop-me']), false);
      assert.equal(match(cond, ['A', 'keep']), true);
    });

    it('exclude 组内多条需全部命中才触发排除', () => {
      const cond = {
        excludeResponseHeaders: [{ header: 'A' }, { header: 'B' }],
      };
      assert.equal(match(cond, ['A', '1'], ['B', '2']), false); // 全部命中 → 排除
      assert.equal(match(cond, ['A', '1']), true); // 只命中一条 → 不排除
    });

    it('空 Condition 匹配任意响应头', () => {
      assert.equal(match({}, ['A', '1']), true);
      assert.equal(match({}), true);
    });

    it('只有 exclude 且未命中时匹配成功', () => {
      assert.equal(
        match({ excludeResponseHeaders: [{ header: 'A', values: ['1'] }] }, [
          'A',
          '2',
        ]),
        true,
      );
      assert.equal(
        match({ excludeResponseHeaders: [{ header: 'A', values: ['1'] }] }, [
          'B',
          '1',
        ]),
        true,
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
        true,
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
        true,
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
        false,
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
        false,
      );
    });
  });

  describe('预处理 / 复用相关', () => {
    it('一次编译可重复用于多个请求且结果互不影响', () => {
      const compiled = compileCondition({
        responseHeaders: [{ header: 'A', values: ['1', 'x*'] }],
      });
      assert.equal(matchCondition(compiled, H(['A', '1'])), true);
      assert.equal(matchCondition(compiled, H(['A', '2'])), false);
      assert.equal(matchCondition(compiled, H(['A', 'xyz'])), true);
      assert.equal(matchCondition(compiled, H()), false);
    });

    it('通配符编译成的正则不带 g/y 标志，复用结果稳定', () => {
      const compiled = compileCondition({
        responseHeaders: [{ header: 'A', values: ['a*'] }],
      });
      assert.equal(matchCondition(compiled, H(['A', 'ab'])), true);
      assert.equal(matchCondition(compiled, H(['A', 'ab'])), true);
      assert.equal(matchCondition(compiled, H(['A', 'ab'])), true);
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
      assert.equal(match({ responseHeaders: [{ header: 'A' }] }), false);
    });

    it('空响应头数组 + 空规则 → 成功', () => {
      assert.equal(match({}), true);
    });

    it('响应头中存在规则未涉及的 header 不影响判定', () => {
      const cond = { responseHeaders: [{ header: 'A', values: ['*'] }] };
      assert.equal(
        match(cond, ['X-Irrelevant', 'x'], ['A', '1'], ['Y-Irrelevant', 'y']),
        true,
      );
    });

    it('多条规则引用同一个 header', () => {
      const cond = {
        responseHeaders: [
          { header: 'A', values: ['x*'] },
          { header: 'A', excludedValues: ['xy'] },
        ],
      };
      assert.equal(match(cond, ['A', 'xa']), true);
      assert.equal(match(cond, ['A', 'xy']), false);
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
        true,
      );
      assert.equal(
        match(
          cond,
          ['Content-Type', 'text/html'],
          ['X-Service', 'health-check'],
        ),
        false,
      );
      assert.equal(
        match(cond, ['Content-Type', 'image/png'], ['X-Service', 'order-api']),
        false,
      );
    });
  });
});
