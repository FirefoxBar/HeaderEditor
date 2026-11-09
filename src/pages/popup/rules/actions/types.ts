import type { ReactNode } from 'react';
import type { PrefValue, Rule } from '@/share/core/types';

export interface RuleAction {
  key: PrefValue['popup-rule-actions'][number];
  icon: React.ReactNode;
  title: string;
  type?: 'danger';
  visible?: (rule: Rule, placement: 'out' | 'menu') => boolean;
  onClick: (rule: Rule) => void;
  renderOut?: (rule: Rule) => ReactNode;
  renderMenu?: (rule: Rule) => ReactNode;
}
