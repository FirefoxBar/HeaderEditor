import { IconDelete, IconPlus } from '@douyinfe/semi-icons';
import { ArrayField, Button, Form, Space } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import React from 'react';
import { t } from '@/share/core/utils';
import { AutoCompleteField } from './auto-complete';

const commonHeaders = {
  request: [
    'a-im',
    'accept',
    'accept-charset',
    'accept-datetime',
    'accept-encoding',
    'accept-language',
    'access-control-request-headers',
    'access-control-request-method',
    'authorization',
    'cache-control',
    'connection',
    'content-length',
    'content-md5',
    'content-type',
    'cookie',
    'date',
    'dnt',
    'expect',
    'forwarded',
    'from',
    'front-end-https',
    'host',
    'http2-settings',
    'if-match',
    'if-modified-since',
    'if-none-match',
    'if-range',
    'if-unmodified-since',
    'max-forwards',
    'origin',
    'pragma',
    'proxy-authorization',
    'proxy-connection',
    'range',
    'referer',
    'save-data',
    'te',
    'upgrade',
    'upgrade-insecure-requests',
    'user-agent',
    'via',
    'warning',
    'x-att-deviceid',
    'x-correlation-id',
    'x-csrf-token',
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-http-method-override',
    'x-request-id',
    'x-requested-with',
    'x-uidh',
    'x-wap-profile',
  ],
  response: [
    'accept-patch',
    'accept-ranges',
    'access-control-allow-credentials',
    'access-control-allow-headers',
    'access-control-allow-methods',
    'access-control-allow-origin',
    'access-control-expose-headers',
    'access-control-max-age',
    'age',
    'allow',
    'alt-svc',
    'cache-control',
    'connection',
    'content-disposition',
    'content-encoding',
    'content-language',
    'content-length',
    'content-location',
    'content-md5',
    'content-range',
    'content-security-policy',
    'content-type',
    'date',
    'delta-base',
    'etag',
    'expires',
    'im',
    'last-modified',
    'link',
    'location',
    'p3p',
    'pragma',
    'proxy-authenticate',
    'public-key-pins',
    'refresh',
    'retry-after',
    'server',
    'set-cookie',
    'status',
    'strict-transport-security',
    'timing-allow-origin',
    'tk',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'vary',
    'via',
    'warning',
    'www-authenticate',
    'x-content-duration',
    'x-content-security-policy',
    'x-content-type-options',
    'x-correlation-id',
    'x-frame-options',
    'x-powered-by',
    'x-request-id',
    'x-ua-compatible',
    'x-webkit-csp',
    'x-xss-protection',
  ],
};

interface HeaderFieldProps {
  field: string;
  initValue?: any;
  type: keyof typeof commonHeaders;
}

const HeaderField = ({ field, type, initValue }: HeaderFieldProps) => (
  <ArrayField field={field} initValue={initValue}>
    {({ add, arrayFields }) => (
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 8px;

          .semi-space > .semi-form-field {
            padding-top: 0;
            padding-bottom: 0;
            flex-grow: 1;
            flex-shrink: 1;
          }
        `}
      >
        {arrayFields.map(({ key, field: subField, remove }) => (
          <Space key={key}>
            <AutoCompleteField noLabel field={`${subField}.name`} placeholder={t('headerName')} list={commonHeaders[type]} />
            <Form.Input noLabel placeholder={t('headerValue')} field={`${subField}.value`} />
            <Button onClick={remove} icon={<IconDelete />} />
          </Space>
        ))}
        <Button onClick={add} icon={<IconPlus />}>
          {t('add')}
        </Button>
      </div>
    )}
  </ArrayField>
);

export default HeaderField;
