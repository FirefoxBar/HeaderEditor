import React, { Fragment } from 'react';
import { t } from 'share/core/utils';
import { Rule } from 'share/core/var';

interface RuleDetailProps {
  rule: Rule;
}

const RuleDetail = (props: RuleDetailProps) => {
  const { rule } = props;

  const isModifyHeader =
    rule.ruleType === 'modifySendHeader' || (rule.ruleType === 'modifyReceiveHeader' && !rule.isFunction);

  return (
    <Fragment>
      <p>
        {t('matchType')}: {t(`match_${rule.matchType}`)}
      </p>
      {rule.matchType !== 'all' && (
        <p>
          {t('matchRule')}: {rule.pattern}
        </p>
      )}
      <p>
        {t('exec_type')}: {t('exec_' + (rule.isFunction ? 'function' : 'normal'))}
      </p>
      {rule.ruleType === 'redirect' && (
        <p>
          {t('redirectTo')}: {rule.to}
        </p>
      )}
      {rule.ruleType === 'modifyReceiveBody' && (
        <p>
          {t('encoding')}: {rule.encoding}
        </p>
      )}
      {isModifyHeader && (
        <Fragment>
          <p>
            {t('headerName')}: {typeof rule.action === 'object' && rule.action.name}
          </p>
          <p>
            {t('headerValue')}: {typeof rule.action === 'object' && rule.action.value}
          </p>
        </Fragment>
      )}
    </Fragment>
  );
};

export default RuleDetail;
