import { Spin } from '@douyinfe/semi-ui';
import { css, cx } from '@emotion/css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { withErrorBoundary } from '@/share/components/error-boundary';
import { VIRTUAL_KEY } from '@/share/core/constant';
import { prefs } from '@/share/core/prefs';
import type { Rule, RuleWithVirtualKey } from '@/share/core/types';
import useGroupOrder from '@/share/hooks/use-group-order';
import RuleFilterPanel from './filter';
import Float from './float';
import GroupSortModal from './group-sort-modal';
import useExpanded from './hooks/use-expanded';
import useRuleGroups from './hooks/use-rule-groups';
import useSelection from './hooks/use-selection';
import useTargetRule from './hooks/use-target-rule';
import RuleGroupCard from './rule-group-card';
import RulesToolbar from './rules-toolbar';

interface RulesProps {
  visible: boolean;
  onEdit: (rule?: Rule) => void;
  targetRule?: { table: string; id: number };
}

const Rules = ({ visible, onEdit, targetRule }: RulesProps) => {
  const { loading, group } = useRuleGroups();
  const { expanded, setExpanded, toggle, expand } = useExpanded();
  const selection = useSelection(group);
  const groupNames = Object.keys(group);
  const { orderedNames, saveOrder } = useGroupOrder(groupNames);

  const [float, setFloat] = useState<RuleWithVirtualKey[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // 首次加载完成后，按偏好决定默认展开还是收起
  useEffect(() => {
    if (loading || initializedRef.current || groupNames.length === 0) {
      return;
    }
    initializedRef.current = true;
    prefs.ready(() => {
      setExpanded(prefs.get('manage-collapse-group') ? [] : groupNames);
    });
  }, [loading, groupNames, setExpanded]);

  useTargetRule({
    targetRule,
    loading,
    group,
    orderedNames,
    listRef,
    expandGroup: expand,
    onEdit,
  });

  const handlePreview = useCallback((item: RuleWithVirtualKey) => {
    setFloat(prev =>
      prev.includes(item) ? prev.filter(it => it !== item) : [...prev, item],
    );
  }, []);

  const handleToggleFilter = useCallback(() => {
    setFilterVisible(prev => !prev);
  }, []);

  const handleCloseFilter = useCallback(() => {
    setFilterVisible(false);
  }, []);

  const handleSortGroups = useCallback(() => {
    setSortVisible(true);
  }, []);

  const handleCloseSort = useCallback(() => {
    setSortVisible(false);
  }, []);

  return (
    <section
      className={cx('section-rules', {
        visible,
        'in-visible': !visible,
      })}
      style={{ paddingBottom: 0 }}
    >
      <RulesToolbar
        isEnableSelect={selection.isEnableSelect}
        onToggleSelect={selection.toggleSelect}
        onToggleSelectAll={selection.toggleSelectAll}
        onBatchEnable={selection.batchEnable}
        onBatchMove={selection.batchMove}
        onBatchShare={selection.batchShare}
        onBatchCopy={selection.batchCopy}
        onBatchDelete={selection.batchDelete}
        onToggleFilter={handleToggleFilter}
        onSortGroups={handleSortGroups}
        onAdd={() => onEdit()}
      />
      <Spin size="large" spinning={loading}>
        <div
          ref={listRef}
          className={css`
            height: calc(100vh - 72px);
            box-sizing: border-box;
            padding-bottom: 4px;
            overflow: auto;
          `}
        >
          {orderedNames.map(name => {
            const item = group[name];
            if (!item) {
              return null;
            }
            return (
              <RuleGroupCard
                key={name}
                name={name}
                expanded={expanded.includes(name)}
                rules={item.rules}
                isEnableSelect={selection.isEnableSelect}
                onSelect={selection.handleSelect}
                selectedKeys={selection.selectedKeys}
                onCollapse={toggle}
                onRuleEdit={onEdit}
                onRulePreview={handlePreview}
              />
            );
          })}
        </div>
      </Spin>
      {float.map(it => (
        <Float
          key={it[VIRTUAL_KEY]}
          rule={it}
          onClose={() => handlePreview(it)}
        />
      ))}
      <RuleFilterPanel
        visible={filterVisible}
        onClose={handleCloseFilter}
        onRuleEdit={onEdit}
        onRulePreview={handlePreview}
      />
      <GroupSortModal
        visible={sortVisible}
        names={orderedNames}
        onSave={saveOrder}
        onClose={handleCloseSort}
      />
    </section>
  );
};

export default withErrorBoundary(Rules);
