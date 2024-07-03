import { ArrayField, Button, Dropdown, Form, Modal, Space } from '@douyinfe/semi-ui';
import { IconDelete, IconPlus } from '@douyinfe/semi-icons';
import { css } from '@emotion/css';
import { useLatest } from 'ahooks';
import React, { FC, useMemo } from 'react';
import { RULE_TYPE } from '@/share/core/constant';
import type { RULE_ACTION_OBJ, Rule } from '@/share/core/types';
import useStorage from '@/share/hooks/use-storage';
import Api from '@/share/pages/api';
import { getVirtualKey, t } from '@/share/core/utils';
import { Toast } from '@/share/pages/toast';
import useOption from '../hooks/use-option';
import type { DropdownProps } from '@douyinfe/semi-ui/lib/es/dropdown';

interface RuleContentSwitcherEditProps {
  initValue: string[];
  onChange: (v: string[]) => void;
}
const RuleContentSwitcherEdit: FC<RuleContentSwitcherEditProps> = (props) => {
  const { initValue = [''], onChange } = props;

  return (
    <Form
      initValues={{
        value: initValue,
      }}
      onValueChange={(v) => onChange(v.value)}
    >
      <ArrayField field="value" initValue={initValue}>
        {({ add, arrayFields }) => (
          <div
            className={css`
              display: flex;
              flex-direction: column;

              .semi-space > .semi-form-field {
                flex-grow: 1;
                flex-shrink: 1;
              }
            `}
          >
            {arrayFields.map(({ key, field, remove }) => (
              <Space key={key}>
                <Form.Input field={field} noLabel />
                <Button type="tertiary" icon={<IconDelete />} onClick={remove} />
              </Space>
            ))}
            <Button icon={<IconPlus />} type="primary" theme="solid" onClick={() => add()}>{t('add')}</Button>
          </div>
        )}
      </ArrayField>
    </Form>
  );
};

interface RuleContentSwitcherProps {
  add?: boolean;
  type: RULE_TYPE;
  children?: any;
  rule: Rule;
}

const RuleContentSwitcher: FC<RuleContentSwitcherProps> = (props) => {
  const { add = false, type, children, rule } = props;

  const newestRule = useLatest(rule);
  const key = useMemo(() => getVirtualKey(rule), [rule]);
  const { value, setValue } = useStorage<string[]>(`rule_switch_${key}`, []);

  const isEnable = useOption('rule-switch', false);

  const menu = useMemo(() => {
    const updateRule = async (k: string, v: any) => {
      const newRule = { ...newestRule.current };
      newRule[k] = v;
      try {
        await Api.saveRule(newRule);
        Toast().success(t('switch_success'));
      } catch (e) {
        Toast().error(e.message);
      }
    };

    const result: DropdownProps['menu'] = value.map((x) => ({
      node: 'item',
      name: x,
      onClick: () => {
        if (type === RULE_TYPE.MODIFY_RECV_HEADER || type === RULE_TYPE.MODIFY_SEND_HEADER) {
          updateRule('action', {
            name: (newestRule.current.action as RULE_ACTION_OBJ).name,
            value: x,
          });
        }
        if (type === RULE_TYPE.REDIRECT) {
          updateRule('action', x);
        }
      },
    }));

    if (add) {
      if (result.length === 0) {
        result.push({
          node: 'item',
          disabled: true,
          name: t('switch_empty'),
        });
      }
      result.push({
        node: 'divider',
      });
      result.push({
        node: 'item',
        name: t('edit'),
        onClick: () => {
          let currentValue = [...value];
          Modal.info({
            title: t('switch_title'),
            icon: null,
            content: <RuleContentSwitcherEdit initValue={currentValue} onChange={(v) => (currentValue = v)} />,
            onOk: () => setValue(currentValue.filter((x) => Boolean(x))),
          });
        },
      });
    }

    return result;
  }, [add, value]);

  if (!isEnable) {
    return null;
  }

  if (![RULE_TYPE.MODIFY_SEND_HEADER, RULE_TYPE.MODIFY_RECV_HEADER, RULE_TYPE.REDIRECT].includes(type) || menu.length === 0) {
    return null;
  }

  return <Dropdown menu={menu}>{children}</Dropdown>;
};

export default RuleContentSwitcher;
