import { Input, useFormState } from '@douyinfe/semi-ui';
import { useDebounceEffect } from 'ahooks';
import { RE2JS } from 're2js';
import React, { useRef, useState } from 'react';
import { IS_MATCH } from '@/share/core/constant';
import { detectRunner, initRule, isMatchUrl } from '@/share/core/rule-utils';
import type { InitdRule } from '@/share/core/types';
import { t } from '@/share/core/utils';
import { getRuleFromInput } from '../utils';

const Test = () => {
  const rule = useRef<InitdRule>();
  const lastValue = useRef<any>();
  const { values } = useFormState();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState('');

  useDebounceEffect(
    () => {
      if (url === '') {
        setResult('');
        return;
      }

      if (lastValue.current !== values || !rule.current) {
        const ruleContent = getRuleFromInput(values);
        try {
          if (ruleContent.condition?.regex) {
            // check re2 syntax
            RE2JS.compile(ruleContent.condition.regex);
          }
          rule.current = initRule(ruleContent, true);
        } catch (e) {
          // 出错
          setResult(e.message);
          return;
        }
      }
      if (!rule.current) {
        return;
      }

      const initdRule = rule.current;
      // 运行
      const match = isMatchUrl(initdRule, url);
      const resultText: { [x: number]: string } = {
        [IS_MATCH.NOT_MATCH]: t('test_mismatch'),
        [IS_MATCH.MATCH_BUT_EXCLUDE]: t('test_exclude'),
      };
      if (typeof resultText[match] !== 'undefined') {
        setResult(resultText[match]);
        return;
      }
      // 匹配通过，实际运行
      if (initdRule.isFunction) {
        setResult(t('test_custom_code'));
        return;
      }
      // 只有重定向支持测试详细功能，其他只返回匹配
      if (initdRule.ruleType === 'redirect' && initdRule.to) {
        let redirect = '';
        if (initdRule?._reg) {
          initdRule._reg.lastIndex = 0;
          redirect = url.replace(initdRule._reg, initdRule.to);
        } else {
          redirect = initdRule.to;
        }
        if (/^(http|https|ftp|file)%3A/.test(redirect)) {
          redirect = decodeURIComponent(redirect);
        }
        setResult(redirect);
      } else {
        setResult(t('test_match'));
      }
    },
    [url, values],
    {
      wait: 300,
    },
  );

  return (
    <>
      <Input value={url} onChange={setUrl} />
      <pre>{result}</pre>
    </>
  );
};

export default Test;
