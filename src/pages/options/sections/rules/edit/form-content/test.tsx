import { Toast, useFormApi, useFormState } from '@douyinfe/semi-ui';
import { useDebounceFn, useRequest } from 'ahooks';
import equal from 'fast-deep-equal';
import { cloneDeep } from 'lodash-es';
import { useEffect, useRef } from 'react';
import RequestMock, {
  type RequestMockApi,
} from '@/pages/options/components/request-mock';
import { t } from '@/share/core/browser';
import { IS_MATCH } from '@/share/core/constant';
import {
  detectRunner,
  initRule,
  isMatchRule,
  isSupportHeaderMatch,
} from '@/share/core/rule-utils';
import type { InitdRule } from '@/share/core/types';
import { isRedirectRule } from '@/share/core/utils';
import useStateIfChanged from '@/share/hooks/use-state-if-changed';
import { compileRe2 } from '../../../rules/utils';
import { getRuleFromInput, isAllowFilterResponseHeaders } from '../utils';

const Test = () => {
  const rule = useRef<InitdRule>();
  const lastValue = useRef<any>();
  const { values } = useFormState();
  const formApi = useFormApi();
  const requestMockApi = useRef<RequestMockApi>();
  const [result, setResult] = useStateIfChanged('');

  const hasResponseHeaders =
    (ENABLE_WEB_REQUEST || isSupportHeaderMatch()) &&
    isAllowFilterResponseHeaders(values?.ruleType);

  const { run } = useRequest(
    async () => {
      const options = requestMockApi.current?.getValues();
      if (!options?.url) {
        setResult('');
        return;
      }

      const formValue = formApi.getValues();

      if (!equal(lastValue.current, formValue) || !rule.current) {
        const ruleContent = getRuleFromInput(formValue);
        let err: Error | undefined;
        try {
          rule.current = initRule(ruleContent, true);
        } catch (e) {
          err = e as Error;
        }
        if (ruleContent.condition?.regex && rule.current && !err) {
          err = compileRe2(rule.current) || undefined;

          if (err && ENABLE_WEB_REQUEST) {
            try {
              rule.current._reg = new RegExp(ruleContent.condition.regex, 'g');
              rule.current.forceRunner = 'web_request';
              err = undefined;
            } catch (e) {
              err = e as Error;
            }
          }
        }
        if (err) {
          setResult(err.message);
          return;
        }
        lastValue.current = cloneDeep(formValue);
      }
      if (!rule.current) {
        return;
      }

      const initdRule = rule.current;
      // 运行，与筛选/运行时使用同一套匹配逻辑
      const match = isMatchRule(initdRule, options);
      if (match === IS_MATCH.MATCH) {
        // 匹配通过，实际运行
        if (initdRule.isFunction) {
          setResult(t('test_custom_code'));
          return;
        }
        // 只有重定向支持测试详细功能，其他只返回匹配
        if (isRedirectRule(initdRule.ruleType) && initdRule.to) {
          const url = options.url as string;
          let redirect = '';
          if (
            detectRunner(initdRule) === 'dnr' &&
            initdRule._re2 &&
            ENABLE_DNR
          ) {
            redirect = initdRule._re2.matcher(url).replaceAll(initdRule.to);
          } else if (initdRule?._reg) {
            redirect = url.replaceAll(initdRule._reg, initdRule.to);
          } else {
            redirect = initdRule.to;
          }
          if (detectRunner(initdRule) === 'web_request') {
            if (/^(http|https|ftp|file)%3A/.test(redirect)) {
              redirect = decodeURIComponent(redirect);
            }
          }
          setResult(redirect);
        } else {
          setResult(t('test_match'));
        }
        return;
      }
      const resultText: { [x: number]: string } = {
        [IS_MATCH.NOT_MATCH]: t('test_mismatch'),
        [IS_MATCH.EXCLUDE]: t('test_exclude'),
      };
      setResult(resultText[match] ?? t('test_mismatch'));
    },
    {
      manual: true,
    },
  );

  const { run: debounceRun } = useDebounceFn(run, { wait: 600 });

  // 规则表单变化时自动重测
  useEffect(() => {
    debounceRun();
  }, [values]);

  const handleRun = () => {
    const url = requestMockApi.current?.getUrl().trim();
    if (!url) {
      Toast.warning(t('url_required'));
      return;
    }
    run();
  };

  // RequestMock 内部已重置表单，这里只清理测试状态
  const handleReset = () => {
    rule.current = undefined;
    lastValue.current = undefined;
    setResult('');
  };

  return (
    <>
      <RequestMock
        submitText={t('test_url')}
        onSubmit={handleRun}
        getApi={api => (requestMockApi.current = api)}
        onReset={handleReset}
        onUrlChange={() => {
          if (requestMockApi.current?.getAdvanced()) {
            return;
          }
          debounceRun();
        }}
        hasResponseHeaders={hasResponseHeaders}
      />
      <pre style={{ padding: 8, borderRadius: 4, backgroundColor: '#f5f5f5' }}>
        {result ? result : <span>&nbsp;</span>}
      </pre>
    </>
  );
};

export default Test;
