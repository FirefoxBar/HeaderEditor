import { Toast, Typography } from '@douyinfe/semi-ui';
import { RE2JS } from 're2js';
import SideEdit from '@/share/components/side-edit';
import { RULE_TYPE } from '@/share/core/constant';
import { prefs } from '@/share/core/prefs';
import type { BasicRule, Rule } from '@/share/core/types';
import { t } from '@/share/core/utils';
import Api from '@/share/pages/api';
import FormContent from './form-content';
import {
  EMPTY_RULE,
  getInput,
  getRuleFromInput,
  type RuleInput,
} from './utils';

const { Text } = Typography;

interface EditProps {
  visible: boolean;
  rule?: BasicRule;
  onClose: () => void;
}

const validateRule = async (rule: BasicRule) => {
  // 常规检查
  if (!rule.name) {
    throw new Error(t('name_empty'));
  }
  if (!rule.condition) {
    throw new Error(t('match_rule_empty'));
  }
  if (rule.condition.regex) {
    RE2JS.compile(rule.condition.regex);
  }
  if (
    [
      'all',
      'url',
      'urlPrefix',
      'method',
      'domain',
      'regex',
      'resourceTypes',
    ].every(x => typeof (rule.condition as any)[x] === 'undefined')
  ) {
    throw new Error(t('match_rule_empty'));
  }
  if (rule.ruleType !== RULE_TYPE.MODIFY_RECV_BODY && !rule.encoding) {
    rule.encoding = 'UTF-8';
  }

  if (rule.isFunction) {
    if (rule.code === '') {
      throw new Error(t('code_empty'));
    }
  } else {
    if (rule.ruleType === 'redirect' && (!rule.to || rule.to === '')) {
      throw new Error(t('redirect_empty'));
    }
    if (
      rule.ruleType === 'modifySendHeader' ||
      rule.ruleType === 'modifyReceiveHeader'
    ) {
      const validateValue = Object.entries(rule.headers || {}).filter(([k]) =>
        Boolean(k),
      );
      if (validateValue.length === 0) {
        throw new Error(t('header_empty'));
      }
    }
  }

  // 检查是否有开启
  if (rule.ruleType === RULE_TYPE.MODIFY_RECV_BODY) {
    if (!prefs.get('modify-body')) {
      prefs.set('modify-body', true);
      Toast.info(t('auto_enable_modify_body'));
    }
  }
};

const Edit = ({ visible, rule: ruleProp, onClose }: EditProps) => {
  const isEdit = Boolean((ruleProp as Rule)?.id);

  return (
    <SideEdit<BasicRule, RuleInput>
      visible={visible}
      onClose={onClose}
      value={ruleProp}
      defaultValue={EMPTY_RULE}
      getInput={getInput}
      getValue={getRuleFromInput}
      onSave={Api.saveRule}
      validate={validateRule}
      isEdit={isEdit}
      footer={
        MANIFEST_VER === 'v3' ? (
          <Text
            type="tertiary"
            link={{ href: t('url_help'), target: '_blank' }}
          >
            {t('lite_edit_tip')}
          </Text>
        ) : null
      }
    >
      <FormContent isEdit={isEdit} />
    </SideEdit>
  );
};

export default Edit;
