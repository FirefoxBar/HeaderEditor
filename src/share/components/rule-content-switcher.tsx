import React, { FC, useMemo } from 'react';
import { Dropdown } from '@douyinfe/semi-ui';
import { DropdownProps } from '@douyinfe/semi-ui/lib/es/dropdown';
import { IconEdit } from '@douyinfe/semi-icons';
import useStorage from '../hooks/use-storage';
import { RULE_TYPE } from '../core/constant';

interface RuleContentSwitcherProps {
  add?: boolean;
  key: string;
  type: RULE_TYPE;
  children?: any;
}

/*
const RuleContentSwitcherEdit = () => {
  const { value, setValue } = useStorage<string[]>(`rule_switch_${key}`, []);

  return <Form>
    <ArrayField field="value" initValue={['']}>
      {({ add, arrayFields, addWithInitValue }) => ()}
    </ArrayField>
  </Form>
}
*/

const RuleContentSwitcher: FC<RuleContentSwitcherProps> = (props) => {
  const { add = false, key, type, children } = props;

  const { value } = useStorage<string[]>(`rule_switch_${key}`, []);

  const menu = useMemo(() => {
    const result: DropdownProps['menu'] = value.map((x) => ({
      node: 'item',
      name: x,
      onClick: () => {
        // TODO: 更新规则
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
          // TODO: 编辑
        },
      });
    }

    return result;
  }, [add, value]);

  return <Dropdown menu={menu}>{children}</Dropdown>;
};

export default RuleContentSwitcher;
