import type { DropDownMenuItem } from '@douyinfe/semi-ui/lib/es/dropdown';
import { createContext, useContext, useMemo } from 'react';
import type { Rule } from '@/share/core/types';
import usePref from '@/share/hooks/use-pref';
import { actions } from './actions';
import type { RuleAction } from './types';

interface ContextValue {
  showQuickPreview: boolean;
  outActions: RuleAction[];
  menuActions: RuleAction[];
}

export const ActionContext = createContext<ContextValue>({
  showQuickPreview: false,
  outActions: [],
  menuActions: [],
});

export const useRuleActionsContext = () => {
  const [outActionKeys] = usePref('popup-rule-actions');
  const [pref] = usePref('show-quick-preview');
  const showQuickPreview = pref.includes('popup');

  const value = useMemo(
    () => ({
      outActions: actions.filter(x => outActionKeys.includes(x.key)),
      menuActions: actions.filter(x => !outActionKeys.includes(x.key)),
      showQuickPreview,
    }),
    [outActionKeys, showQuickPreview],
  );

  return value;
};

export const useRuleActions = (rule: Rule) => {
  const { outActions, menuActions, showQuickPreview } =
    useContext(ActionContext);

  const final = useMemo(() => {
    return {
      outActions: outActions.filter(x =>
        x.visible ? x.visible(rule, 'out') : true,
      ),
      menuActions: menuActions
        .filter(x => (x.visible ? x.visible(rule, 'menu') : true))
        .map(
          x =>
            ({
              node: 'item',
              name: x.title,
              onClick: () => x.onClick(rule),
              icon: x.icon,
              type: x.type,
            }) as DropDownMenuItem,
        ),
    };
  }, [outActions, menuActions, rule]);

  return { ...final, showQuickPreview };
};
