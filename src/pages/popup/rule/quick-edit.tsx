import { IconEdit } from '@douyinfe/semi-icons';
import { Button, Form, Input, Modal } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import { useLatest } from 'ahooks';
import React, { ReactNode, useCallback } from 'react';
import { RULE_TYPE } from '@/share/core/constant';
import { RULE_ACTION_OBJ, Rule } from '@/share/core/types';
import { t } from '@/share/core/utils';
import useOption from '@/share/hooks/use-option';
import Api from '@/share/pages/api';
import { Toast } from '@/share/pages/toast';

interface QuickEditProps {
  rule: Rule;
}

const QuickEdit = ({ rule }: QuickEditProps) => {
  const { isFunction, ruleType } = rule;
  const ruleRef = useLatest(rule);

  const isEnable = useOption('quick-edit', false);

  const handleEdit = useCallback(() => {
    const newRule = { ...ruleRef.current };

    let content: ReactNode = null;
    if (newRule.ruleType === RULE_TYPE.REDIRECT) {
      content = (
        <Form.Slot label={t('redirectTo')}>
          <Input defaultValue={newRule.to} onChange={(v) => (newRule.to = v)} />
        </Form.Slot>
      );
    }

    if ([RULE_TYPE.MODIFY_RECV_HEADER, RULE_TYPE.MODIFY_SEND_HEADER].includes(newRule.ruleType)) {
      newRule.action = { ...(newRule.action as RULE_ACTION_OBJ) };
      content = (
        <>
          <Form.Slot label={t('headerName')}>
            <Input
              defaultValue={(newRule.action as RULE_ACTION_OBJ).name}
              onChange={(v) => ((newRule.action as RULE_ACTION_OBJ).name = v)}
            />
          </Form.Slot>
          <Form.Slot label={t('headerValue')}>
            <Input
              defaultValue={(newRule.action as RULE_ACTION_OBJ).value}
              onChange={(v) => ((newRule.action as RULE_ACTION_OBJ).value = v)}
            />
          </Form.Slot>
        </>
      );
    }

    Modal.confirm({
      icon: null,
      closable: false,
      className: css`
        .semi-modal {
          margin: 0;
          position: fixed;
          bottom: 0;
          width: 100%;
          > .semi-modal-content {
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            border-bottom: 0;
            border-left: 0;
            border-right: 0;

            > .semi-modal-footer {
              margin-top: 0;
              margin-bottom: 12px;
            }
          }
        }
      `,
      content,
      onOk: async () => {
        if (newRule.ruleType === 'redirect' && (!newRule.to || newRule.to === '')) {
          Toast().error(t('redirect_empty'));
          return;
        }
        if (
          (newRule.ruleType === 'modifySendHeader' || newRule.ruleType === 'modifyReceiveHeader') &&
          (typeof newRule.action !== 'object' || newRule.action.name === '')
        ) {
          Toast().error(t('header_empty'));
          return;
        }
        try {
          await Api.saveRule(newRule);
          Toast().success(t('saved'));
        } catch (e) {
          Toast().error(e.message);
        }
      },
    });
  }, []);

  if (!isEnable) {
    return null;
  }

  if (
    isFunction ||
    ![RULE_TYPE.MODIFY_RECV_HEADER, RULE_TYPE.MODIFY_SEND_HEADER, RULE_TYPE.REDIRECT].includes(ruleType)
  ) {
    return null;
  }

  return <Button theme="borderless" type="tertiary" size="small" icon={<IconEdit />} onClick={handleEdit} />;
};

export default QuickEdit;
