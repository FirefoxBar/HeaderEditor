import { ArrayField, Button, Dropdown, Form, Modal, Space, Tag } from '@douyinfe/semi-ui';
import { IconDelete, IconPlus } from '@douyinfe/semi-icons';
import { css, cx } from '@emotion/css';
import { useLatest } from 'ahooks';
import React, { FC, useMemo } from 'react';
import { RULE_TYPE } from '@/share/core/constant';
import type { Rule } from '@/share/core/types';
import useStorage from '@/share/hooks/use-storage';
import Api from '@/share/pages/api';
import { getVirtualKey, t } from '@/share/core/utils';
import { Toast } from '@/share/pages/toast';
import useOption from '../hooks/use-option';
import { tagList } from '../pages/styles';
import HeaderField from './header-field';
import type { DropdownProps } from '@douyinfe/semi-ui/lib/es/dropdown';

interface RuleContentSwitcherEditProps {
  isHeader: boolean;
  initValue: Array<string | Record<string, string>>;
  onChange: (v: Array<string | Record<string, string>>) => void;
}
const RuleContentSwitcherEdit: FC<RuleContentSwitcherEditProps> = (props) => {
  const { initValue = [''], onChange, isHeader } = props;

  const basicStyle = css`
    display: flex;
    flex-direction: column;

    .semi-space > .semi-form-field {
      flex-grow: 1;
      flex-shrink: 1;
    }
  `;

  const headerEditStyle = css`
    gap: 8px;

    > * {
      width: 100%;
    }

    .header-field {
      flex-grow: 1;
      border: 1px solid var(--semi-color-border);
      padding: 8px;
      border-radius: var(--semi-border-radius-medium);
    }
  `;

  return (
    <Form initValues={{ value: initValue }} onValueChange={(v) => onChange(v.value)}>
      <ArrayField field="value" initValue={initValue}>
        {({ add, arrayFields }) => (
          <div className={cx(basicStyle, { [headerEditStyle]: isHeader })}>
            {arrayFields.map(({ key, field, remove }) => (
              <Space key={key}>
                {isHeader ? <HeaderField field={field} /> : <Form.Input field={field} noLabel />}
                <Button type="tertiary" icon={<IconDelete />} onClick={remove} />
              </Space>
            ))}
            <Button icon={<IconPlus />} type="primary" theme="solid" onClick={() => add()}>
              {t('add')}
            </Button>
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
  size?: 'small' | 'default';
}

const smallStyle = css`
  .semi-dropdown-item {
    padding: 4px 8px;
    font-size: 13px;
  }
`;

const RuleContentSwitcher: FC<RuleContentSwitcherProps> = (props) => {
  const { add = false, type, children, rule, size } = props;

  const newestRule = useLatest(rule);
  const key = useMemo(() => getVirtualKey(rule), [rule]);
  const { value, setValue } = useStorage<Array<string | Record<string, string>>>(`rule_switch_${key}`, []);

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

    const isHeader = [RULE_TYPE.MODIFY_RECV_HEADER, RULE_TYPE.MODIFY_SEND_HEADER].includes(rule.ruleType);

    const result: DropdownProps['menu'] = value.map((x) => ({
      node: 'item',
      name:
        typeof x === 'string' ? (
          x
        ) : ((
          <div className={tagList}>
            {Object.keys(x).map((k) => (
              <Tag color="grey" key={k} size="small" shape="circle">
                {k}: {x[k]}
              </Tag>
            ))}
          </div>
        ) as any),
      onClick: () => {
        if (isHeader) {
          updateRule('headers', x);
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
          let currentValue: any = [...value];
          if (isHeader) {
            currentValue = currentValue.map((x) => Object.entries(x).map(([name, v]) => ({ name, value: v })));
          }
          Modal.info({
            title: t('switch_title'),
            icon: null,
            content: (
              <RuleContentSwitcherEdit
                isHeader={isHeader}
                initValue={currentValue}
                onChange={(v) => (currentValue = v)}
              />
            ),
            onOk: () => {
              let finalValue = currentValue.filter((x) => Boolean(x));
              if (isHeader) {
                finalValue = Object.fromEntries(
                  currentValue.filter((x) => Boolean(x.name)).map(({ name, v }) => [name, v]),
                );
              }
              setValue(finalValue);
            },
          });
        },
      });
    }

    return result;
  }, [add, value]);

  if (!isEnable || menu.length === 0) {
    return null;
  }

  if (
    ![RULE_TYPE.MODIFY_SEND_HEADER, RULE_TYPE.MODIFY_RECV_HEADER, RULE_TYPE.REDIRECT].includes(type) ||
    rule.isFunction
  ) {
    return null;
  }

  return (
    <Dropdown
      className={cx({
        [smallStyle]: size === 'small',
      })}
      style={{ minWidth: '120px' }}
      menu={menu}
    >
      {children}
    </Dropdown>
  );
};

export default RuleContentSwitcher;
