import { Form, Input } from '@douyinfe/semi-ui';
import type { Rule } from '@/share/core/types';
import { getTableName } from '@/share/core/utils';
import Api from '@/share/pages/api';
import Modal from '../components/modal';
import { t } from '../core/browser';
import { convertToBasicRule } from '../core/rule-utils';

export function toggleRule(rule: Rule, enable: boolean) {
  rule.enable = enable;
  return Api.saveRule(rule);
}

export function remove(rule: Rule) {
  const table = getTableName(rule.ruleType);
  return table ? Api.removeRule(table, rule.id) : Promise.resolve();
}

export function save(rule: Rule) {
  return Api.saveRule(rule);
}

export function clone(rule: Rule) {
  let v = `${rule.name}_clone`;
  Modal.confirm({
    title: t('clone'),
    content: (
      <Form.Slot label={t('name')}>
        <Input defaultValue={v} onChange={value => (v = value)} />
      </Form.Slot>
    ),
    icon: null,
    onOk: () => {
      const newRule = convertToBasicRule(rule);
      newRule.name = v;
      return Api.saveRule(newRule);
    },
  });
}
