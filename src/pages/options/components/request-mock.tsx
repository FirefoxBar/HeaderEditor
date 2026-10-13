import { IconCustomize } from '@douyinfe/semi-icons';
import { Button, Form, Input, Space } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { css } from '@emotion/css';
import { useGetState, useLatest } from 'ahooks';
import { useCallback, useEffect, useRef } from 'react';
import type { DeclarativeNetRequest } from 'webextension-polyfill';
import HeaderField from '@/share/components/header-field';
import { t } from '@/share/core/browser';
import type { HeaderPair } from '@/share/core/header-matcher';
import type { RuleFilterOptions } from '@/share/core/types';
import { METHOD_LIST, RESOURCE_TYPE_LIST } from './constant';

export interface MockRequest {
  url?: string;
  method?: string;
  resourceType?: DeclarativeNetRequest.ResourceType;
  responseHeaders?: Array<HeaderPair>;
}

export interface RequestMockApi {
  getValues: () => MockRequest;
  reset: () => void;
  getUrl: () => string;
  setValues: (values: MockRequest) => void;
  setAdvanced: (advanced: boolean) => void;
  getAdvanced: () => boolean;
}

export interface RequestMockProps {
  submitText: string;
  onSubmit: () => void;
  onAdvancedChange?: (advanced: boolean) => void;
  onReset?: () => void;
  onUrlChange?: (url: string) => void;
  getApi: (api: RequestMockApi) => void;
  hasResponseHeaders?: boolean;
}

const RequestMock = ({
  submitText,
  onSubmit,
  getApi,
  onAdvancedChange,
  onReset,
  onUrlChange,
  hasResponseHeaders = true,
}: RequestMockProps) => {
  const formApi = useRef<FormApi<MockRequest>>();
  const [advanced, setAdvanced, getAdvanced] = useGetState(false);
  const [url, setUrl, getUrl] = useGetState('');

  const onResetRef = useLatest(onReset);
  const hasResponseHeadersRef = useLatest(hasResponseHeaders);

  const handleReset = useCallback(() => {
    setUrl('');
    formApi.current?.reset();
    setAdvanced(false);
    onResetRef.current?.();
  }, []);

  useEffect(() => {
    getApi({
      getUrl: () => getUrl(),
      setValues: values => {
        setUrl(values.url || '');
        if (getAdvanced()) {
          formApi.current?.setValues(
            {
              method: values.method?.toLowerCase(),
              resourceType: values.resourceType,
              responseHeaders: values.responseHeaders,
            },
            {
              isOverride: true,
            },
          );
        }
      },
      getValues: () => {
        const values = formApi.current?.getValues() || {};
        const options: MockRequest = { url: getUrl().trim() };
        // 高级字段默认态下隐藏，不参与匹配
        if (getAdvanced()) {
          const { method, resourceType, responseHeaders } = values;
          if (method) {
            options.method = method.toLowerCase();
          }
          if (resourceType) {
            options.resourceType = resourceType as NonNullable<
              RuleFilterOptions['resourceType']
            >;
          }
          if (hasResponseHeadersRef.current) {
            // 空 name 的行不参与匹配
            const validHeaders = (responseHeaders || [])
              .filter(it => Boolean(it?.name))
              .map(it => ({
                name: String(it.name).toLowerCase(),
                value: it.value,
              }));
            if (validHeaders.length > 0) {
              options.responseHeaders = validHeaders;
            }
          }
        }
        return options;
      },
      reset: () => handleReset(),
      setAdvanced: advanced => setAdvanced(advanced),
      getAdvanced: () => getAdvanced(),
    });
  }, []);

  return (
    <Form<MockRequest>
      labelCol={{ fixedSpan: 4 }}
      getFormApi={api => (formApi.current = api)}
      labelPosition="left"
      labelAlign="right"
      labelWidth={140}
      initValues={{}}
      className={css`
        .url-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;

          > .semi-input-wrapper {
            flex: 1;
          }
        }
      `}
    >
      <div className="url-input-wrapper">
        <Input
          value={url}
          onChange={u => {
            onUrlChange?.(u);
            setUrl(u);
          }}
          placeholder="https://..."
          showClear
        />
        <Button
          icon={<IconCustomize />}
          onClick={() => {
            onAdvancedChange?.(!advanced);
            setAdvanced(!advanced);
          }}
        >
          {t('advanced')}
        </Button>
      </div>
      {advanced && (
        <>
          <Form.Select
            label={t('match_method')}
            field="method"
            showClear
            optionList={METHOD_LIST}
          />
          <Form.Select
            label={t('match_resourceType')}
            field="resourceType"
            showClear
            optionList={RESOURCE_TYPE_LIST}
          />
          {hasResponseHeaders && (
            <Form.Slot label={t('response_headers')}>
              <HeaderField field="responseHeaders" type="response" />
            </Form.Slot>
          )}
          <Form.Slot>
            <Space>
              <Button type="primary" theme="solid" onClick={onSubmit}>
                {submitText}
              </Button>
              <Button theme="light" type="tertiary" onClick={handleReset}>
                {t('reset')}
              </Button>
            </Space>
          </Form.Slot>
        </>
      )}
    </Form>
  );
};

export default RequestMock;
