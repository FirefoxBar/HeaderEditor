import {
  Form,
  useFormApi,
  useFormState,
} from '@douyinfe/semi-ui';
import * as React from 'react';
import { RULE_MATCH_TYPE } from '@/share/core/constant';
import { isValidArray, t } from '@/share/core/utils';
import Domains from '../domains';
import { METHOD_LIST, RESOURCE_TYPE_LIST } from '../options';
import { RuleInput } from '../utils';

const Match = () => {
  const formApi = useFormApi();
  const { values } = useFormState();

  const { editMatchType = [], editExcludeType = [] } = values as RuleInput;

  return (
    <>
      <Form.CheckboxGroup
        label={t('matchType')}
        field="editMatchType"
        options={[
          {
            label: t('match_all'),
            value: RULE_MATCH_TYPE.ALL,
            disabled: [
              RULE_MATCH_TYPE.REGEXP,
              RULE_MATCH_TYPE.DOMAIN,
              RULE_MATCH_TYPE.PREFIX,
              RULE_MATCH_TYPE.URL,
            ].some((x) => editMatchType.includes(x)),
          },
          {
            label: t('match_regexp'),
            value: RULE_MATCH_TYPE.REGEXP,
            disabled: [RULE_MATCH_TYPE.ALL, RULE_MATCH_TYPE.PREFIX, RULE_MATCH_TYPE.URL].some((x) =>
              editMatchType.includes(x)),
          },
          {
            label: t('match_domain'),
            value: RULE_MATCH_TYPE.DOMAIN,
            disabled: editMatchType.includes(RULE_MATCH_TYPE.ALL),
          },
          {
            label: t('match_prefix'),
            value: RULE_MATCH_TYPE.PREFIX,
            disabled: [RULE_MATCH_TYPE.ALL, RULE_MATCH_TYPE.REGEXP, RULE_MATCH_TYPE.URL].some((x) =>
              editMatchType.includes(x)),
          },
          {
            label: t('match_url'),
            value: RULE_MATCH_TYPE.URL,
            disabled: [RULE_MATCH_TYPE.ALL, RULE_MATCH_TYPE.REGEXP, RULE_MATCH_TYPE.PREFIX].some((x) =>
              editMatchType.includes(x)),
          },
          {
            label: t('match_method'),
            value: RULE_MATCH_TYPE.METHOD,
            disabled: editExcludeType.includes('method'),
          },
          {
            label: t('match_resourceType'),
            value: RULE_MATCH_TYPE.RESOURCE_TYPE,
            disabled: editExcludeType.includes('resourceType'),
          },
        ]}
        onChange={(value) => {
          if (value.includes(RULE_MATCH_TYPE.DOMAIN)) {
            const a = formApi.getValue('condition.domain');
            if (!isValidArray(a)) {
              formApi.setValue('condition.domain', ['']);
            }
          }
        }}
      />
      {editMatchType.includes(RULE_MATCH_TYPE.REGEXP) && (
        <Form.Input label={t('match_regexp')} field="condition.regex" />
      )}
      {editMatchType.includes(RULE_MATCH_TYPE.DOMAIN) && (
        <Form.Slot label={t('match_domain')}>
          <Domains field="condition.domain" />
        </Form.Slot>
      )}
      {editMatchType.includes(RULE_MATCH_TYPE.PREFIX) && (
        <Form.Input label={t('match_prefix')} field="condition.urlPrefix" />
      )}
      {editMatchType.includes(RULE_MATCH_TYPE.URL) && <Form.Input label={t('match_url')} field="condition.url" />}
      {editMatchType.includes(RULE_MATCH_TYPE.METHOD) && (
        <Form.Select multiple label={t('match_method')} field="condition.method" optionList={METHOD_LIST} />
      )}
      {editMatchType.includes(RULE_MATCH_TYPE.RESOURCE_TYPE) && (
        <Form.Select
          multiple
          label={t('match_resourceType')}
          field="condition.resourceTypes"
          optionList={RESOURCE_TYPE_LIST}
        />
      )}
    </>
  );
};

export default Match;
