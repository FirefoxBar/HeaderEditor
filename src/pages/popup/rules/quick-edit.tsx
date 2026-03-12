import { IconEdit } from '@douyinfe/semi-icons';
import { Button, Form, Input } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import { useLatest } from 'ahooks';
import { type ReactNode, useCallback } from 'react';
import HeaderField from '@/share/components/header-field';
import Modal from '@/share/components/modal';
import { RULE_TYPE } from '@/share/core/constant';
import type { Rule } from '@/share/core/types';
import { t } from '@/share/core/utils';
import usePref from '@/share/hooks/use-pref';
import Api from '@/share/pages/api';
import { Toast } from '@/share/pages/toast';

interface QuickEditProps {
  rule: Rule;
}

const modalCls = css`
  .semi-modal {
    margin: 0;
    position: fixed;
    bottom: 0;
    width: 100%;
    .semi-modal-body {
      max-height: calc(90vh - 90px);
      overflow: auto;
      scrollbar-width: thin;
    }
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
`;
const QuickEdit = ({ rule }: QuickEditProps) => {
  const { isFunction, ruleType } = rule;
  const ruleRef = useLatest(rule);

  const [isEnable] = usePref('quick-edit');

  const handleEdit = useCallback(() => {
    const newRule = { ...ruleRef.current };

    let content: ReactNode = null;
    if (newRule.ruleType === RULE_TYPE.REDIRECT) {
      content = (
        <Form.Slot label={t('redirectTo')}>
          <Input defaultValue={newRule.to} onChange={v => (newRule.to = v)} />
        </Form.Slot>
      );
    }

    if (
      [RULE_TYPE.MODIFY_RECV_HEADER, RULE_TYPE.MODIFY_SEND_HEADER].includes(
        newRule.ruleType,
      )
    ) {
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
          <HeaderField field="header" type={undefined} />
        </Form>
      );
    }

    Modal.confirm({
      icon: null,
      closable: false,
      className: modalCls,
      content,
      onOk: async () => {
        if (
          newRule.ruleType === 'redirect' &&
          (!newRule.to || newRule.to === '')
        ) {
          Toast().error(t('redirect_empty'));
          return;
        }
        if (
          newRule.ruleType === 'modifySendHeader' ||
          newRule.ruleType === 'modifyReceiveHeader'
        ) {
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
  }, []);

  if (!isEnable) {
    return null;
  }

  if (
    isFunction ||
    ![
      RULE_TYPE.MODIFY_RECV_HEADER,
      RULE_TYPE.MODIFY_SEND_HEADER,
      RULE_TYPE.REDIRECT,
    ].includes(ruleType)
  ) {
    return null;
  }

  return (
    <Button
      theme="borderless"
      type="tertiary"
      size="small"
      icon={<IconEdit />}
      onClick={handleEdit}
    />
  );
};

export default QuickEdit;
