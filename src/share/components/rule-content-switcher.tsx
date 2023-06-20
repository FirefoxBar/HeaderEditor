import { ArrayField, Button, Dropdown, Form, Modal, Space } from '@douyinfe/semi-ui';
import { IconDelete, IconEdit, IconPlus } from '@douyinfe/semi-icons';
import { css } from '@emotion/css';
import { useLatest } from 'ahooks';
import React, { FC, useMemo } from 'react';
import { RULE_TYPE } from '@/share/core/constant';
import type { RULE_ACTION_OBJ, Rule } from '@/share/core/types';
import useStorage from '@/share/hooks/use-storage';
import Api from '@/share/pages/api';
import type { DropdownProps } from '@douyinfe/semi-ui/lib/es/dropdown';

interface RuleContentSwitcherEditProps {
  initValue: string[];
  onChange: (v: string[]) => void;
}
const RuleContentSwitcherEdit: FC<RuleContentSwitcherEditProps> = (props) => {
  const { initValue, onChange } = props;

  return (
    <Form
      initValues={{
        value: initValue,
      }}
      onValueChange={(v) => onChange(v.value)}
    >
      <ArrayField field="value" initValue={['']}>
        {({ add, arrayFields }) => (
          <div
            className={css`
              display: flex;
              flex-direction: column;
            `}
          >
            {arrayFields.map(({ key, field, remove }) => (
              <Space key={key}>
                <Form.Input field={field} />
                <Button type="tertiary" icon={<IconDelete />} onClick={remove} />
              </Space>
            ))}
            <Button icon={<IconPlus />} type="primary" theme="solid" onClick={() => add()} />
          </div>
        )}
      </ArrayField>
    </Form>
  );
};

interface RuleContentSwitcherProps {
  add?: boolean;
  key: string;
  type: RULE_TYPE;
  children?: any;
  rule: Rule;
}

const RuleContentSwitcher: FC<RuleContentSwitcherProps> = (props) => {
  const { add = false, key, type, children, rule } = props;

  const newestRule = useLatest(rule);
  const { value, setValue } = useStorage<string[]>(`rule_switch_${key}`, []);

  const menu = useMemo(() => {
    const updateRule = (k: string, v: any) => {
      const newRule = { ...newestRule.current };
      newRule[k] = v;
      Api.saveRule(newRule);
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
      result.push({
        node: 'divider',
      });
      result.push({
        node: 'item',
        // @ts-ignore
        name: <IconEdit />,
        onClick: () => {
          let currentValue = [...value];
          // TODO: 编辑
          Modal.info({
            title: 'edit',
            icon: null,
            content: <RuleContentSwitcherEdit initValue={currentValue} onChange={(v) => (currentValue = v)} />,
            onOk: () => setValue(currentValue.filter((x) => Boolean(x))),
          });
        },
      });
    }

    return result;
  }, [add, value]);

  if (![RULE_TYPE.MODIFY_SEND_HEADER, RULE_TYPE.MODIFY_RECV_HEADER, RULE_TYPE.REDIRECT].includes(type) || menu.length === 0) {
    return null;
  }

  return <Dropdown menu={menu}>{children}</Dropdown>;
};

export default RuleContentSwitcher;
