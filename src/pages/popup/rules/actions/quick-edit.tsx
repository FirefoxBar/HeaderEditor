import { IconEdit } from '@douyinfe/semi-icons';
import { Form, Input } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import type { ReactNode } from 'react';
import HeaderField from '@/share/components/header-field';
import Modal from '@/share/components/modal';
import { t } from '@/share/core/browser';
import { isModifyHeaderRule, isRedirectRule } from '@/share/core/utils';
import Api from '@/share/pages/api';
import { Toast } from '@/share/pages/toast';
import type { RuleAction } from './types';

const modalCls = css`
  .semi-modal-content > .semi-modal-footer {
    margin-top: 0;
    margin-bottom: 12px;
  }
`;

export const quickEditAction: RuleAction = {
  key: 'edit',
  icon: <IconEdit />,
  title: t('quick_edit'),
  visible: rule =>
    isModifyHeaderRule(rule.ruleType) || isRedirectRule(rule.ruleType),
  onClick: rule => {
    const newRule = { ...rule };

    let content: ReactNode = null;
    if (isRedirectRule(newRule.ruleType)) {
      content = (
        <Form.Slot label={t('redirectTo')}>
          <Input defaultValue={newRule.to} onChange={v => (newRule.to = v)} />
        </Form.Slot>
      );
    }

    if (isModifyHeaderRule(newRule.ruleType)) {
      const defaultValue = Object.entries(newRule.headers || {}).map(
        ([name, value]) => ({
          name,
          value,
        }),
      );
      content = (
        <Form
          initValues={{ header: defaultValue }}
          onValueChange={({ header }) =>
            (newRule.headers = Object.fromEntries(
              header
                .filter((x: any) => Boolean(x.name))
                .map((x: any) => [x.name, x.value]),
            ))
          }
        >
          <HeaderField
            field="header"
            type={undefined}
            size="small"
            className={css`
            .name-input {
              max-width: 28%;
            }
          `}
          />
        </Form>
      );
    }

    Modal.confirm({
      icon: null,
      closable: false,
      className: modalCls,
      content,

      onOk: async () => {
        if (isRedirectRule(newRule.ruleType) && !newRule.to) {
          Toast().error(t('redirect_empty'));
          return;
        }
        if (isModifyHeaderRule(newRule.ruleType)) {
          const validateValue = Object.entries(newRule.headers || {}).filter(
            ([k]) => Boolean(k),
          );
          if (validateValue.length === 0) {
            Toast().error(t('header_empty'));
            return;
          }
        }
        try {
          await Api.saveRule(newRule);
          Toast().success(t('saved'));
        } catch (e) {
          Toast().error((e as Error).message);
        }
      },
    });
  },
};
