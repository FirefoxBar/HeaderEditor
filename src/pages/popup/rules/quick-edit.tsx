import { IconEdit, IconItalic, IconPlusCircle } from '@douyinfe/semi-icons';
import { Button, Form, Input, Modal, Tabs } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import { useLatest } from 'ahooks';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { RULE_TYPE } from '@/share/core/constant';
import type { Rule } from '@/share/core/types';
import { t } from '@/share/core/utils';
import usePref from '@/share/hooks/use-pref';
import Api from '@/share/pages/api';
import { Toast } from '@/share/pages/toast';

interface HeaderQuickEditProps {
  defaultValue: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}

const HeaderQuickEdit = ({ defaultValue, onChange }: HeaderQuickEditProps) => {
  const [innerValue, setInnerValue] = useState<Array<[string, string]>>([]);

  useEffect(() => {
    setInnerValue(Object.entries(defaultValue));
  }, []);

  const handleChange = (processValue: (v: Array<[string, string]>) => void) => {
    setInnerValue(prev => {
      const res = [...prev];
      processValue(res);
      onChange(Object.fromEntries(res.filter(x => Boolean(x[0]))));
      return res;
    });
  };

  const handleItemChange = (index: number, keyIndex: number, value: string) => {
    handleChange(res => {
      const newItem: [string, string] = [...res[index]];
      newItem[keyIndex] = value;
      res[index] = newItem;
    });
  };

  return (
    <Tabs
      defaultActiveKey="0"
      collapsible
      onTabClose={key => handleChange(res => res.splice(Number(key), 1))}
      tabBarExtraContent={
        <Button
          onClick={() => handleChange(res => res.push(['', '']))}
          icon={<IconPlusCircle />}
        />
      }
      size="small"
      type="card"
      keepDOM
    >
      {innerValue.map(([name, value], index) => {
        return (
          <Tabs.TabPane
            key={index}
            closable
            itemKey={String(index)}
            tab={name || <IconItalic />}
          >
            <Form.Slot label={t('headerName')}>
              <Input
                value={name}
                onChange={v => handleItemChange(index, 0, v)}
              />
            </Form.Slot>
            <Form.Slot label={t('headerValue')}>
              <Input
                value={value}
                onChange={v => handleItemChange(index, 1, v)}
              />
            </Form.Slot>
          </Tabs.TabPane>
        );
      })}
    </Tabs>
  );
};

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
      overflow: hidden;
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
      const defaultValue = newRule.headers || {};
      content = (
        <HeaderQuickEdit
          defaultValue={defaultValue}
          onChange={v => (newRule.headers = v)}
        />
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
