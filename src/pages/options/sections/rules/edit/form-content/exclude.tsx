import { Form, Typography, useFormApi, useFormState } from '@douyinfe/semi-ui';
import { t } from '@/share/core/browser';
import { RULE_MATCH_TYPE } from '@/share/core/constant';
import { isSupportHeaderInfo } from '@/share/core/rule-utils';
import { isValidArray } from '@/share/core/utils';
import Domains from '../components/domains';
import HeaderMatchInfo from '../components/header-match-info';
import { METHOD_LIST, RESOURCE_TYPE_LIST } from '../options';
import { isAllowFilterResponseHeaders, type RuleInput } from '../utils';

const { Text } = Typography;

const Exclude = () => {
  const formApi = useFormApi();
  const { values } = useFormState();

  const {
    editMatchType = [],
    editExcludeType = [],
    ruleType,
  } = values as RuleInput;

  return (
    <>
      <Form.CheckboxGroup
        label={t('excludeRule')}
        field="editExcludeType"
        options={[
          {
            label: t('match_regexp'),
            value: 'regex',
          },
          {
            label: t('match_domain'),
            value: 'domain',
          },
          {
            label: t('match_method'),
            value: 'method',
            disabled: editMatchType.includes(RULE_MATCH_TYPE.METHOD),
          },
          {
            label: t('match_resourceType'),
            value: 'resourceType',
            disabled: editMatchType.includes(RULE_MATCH_TYPE.RESOURCE_TYPE),
          },
          {
            label: t('response_headers'),
            value: 'responseHeaders',
            disabled:
              (!ENABLE_WEB_REQUEST && !isSupportHeaderInfo()) ||
              !isAllowFilterResponseHeaders(ruleType),
          },
        ]}
        onChange={value => {
          if (value.includes(RULE_MATCH_TYPE.DOMAIN)) {
            const a = formApi.getValue('condition.excludeDomain');
            if (!isValidArray(a)) {
              formApi.setValue('condition.excludeDomain', ['']);
            }
          }
        }}
      />
      {editExcludeType.includes('regex') && (
        <Form.Input
          label={t('match_regexp')}
          field="condition.excludeRegex"
          helpText={
            MANIFEST_VER === 'v3' ? (
              <Text type="tertiary">{t('lite_not_support')}</Text>
            ) : undefined
          }
        />
      )}
      {editExcludeType.includes('domain') && (
        <Form.Slot label={t('match_domain')}>
          <Domains field="condition.excludeDomain" />
        </Form.Slot>
      )}
      {editExcludeType.includes('method') && (
        <Form.Select
          multiple
          label={t('match_method')}
          field="condition.excludeMethod"
          optionList={METHOD_LIST}
        />
      )}
      {editExcludeType.includes('resourceType') && (
        <Form.Select
          multiple
          label={t('match_resourceType')}
          field="condition.excludeResourceTypes"
          optionList={RESOURCE_TYPE_LIST}
        />
      )}
      {editExcludeType.includes('responseHeaders') && (
        <Form.Slot label={t('response_headers')}>
          <HeaderMatchInfo
            field="condition.excludeResponseHeaders"
            type="response"
          />
        </Form.Slot>
      )}
    </>
  );
};

export default Exclude;
