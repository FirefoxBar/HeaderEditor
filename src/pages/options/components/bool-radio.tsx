import { RadioGroup, withField } from '@douyinfe/semi-ui';
import type { OptionItem, RadioChangeEvent, RadioGroupProps } from '@douyinfe/semi-ui/lib/es/radio';
import React, { useMemo } from 'react';

interface BoolOptionItem extends Omit<OptionItem, 'value'> {
  value: boolean;
}

interface BoolRadioGroupProps extends Omit<RadioGroupProps, 'value' | 'defaultValue' | 'onChange' | 'options'> {
  value?: boolean;
  defaultValue?: boolean;
  onChange?: (v: boolean) => void;
  options?: BoolOptionItem[];
}

const BoolRadioGroup = (props: BoolRadioGroupProps) => {
  const { value: valueProp, defaultValue: defaultValueProp, onChange: onChangeProp, options: optionsProp } = props;

  const options = useMemo(() => optionsProp?.map((x) => ({ ...x, value: x.value ? 'y' : 'n' })), [optionsProp]);

  const defaultValue = defaultValueProp ? 'y' : 'n';
  // eslint-disable-next-line no-nested-ternary
  const value = typeof valueProp === 'boolean' ? valueProp ? 'y' : 'n' : undefined;

  const onChange = (e: RadioChangeEvent) => onChangeProp?.(e.target.value === 'y');

  return <RadioGroup {...props} value={value} defaultValue={defaultValue} options={options} onChange={onChange} />;
};

export const BoolRadioGroupField = withField(BoolRadioGroup);
export default BoolRadioGroup;
