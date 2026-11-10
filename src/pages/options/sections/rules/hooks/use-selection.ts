import { type Key, useCallback, useMemo, useState } from 'react';
import { selectGroup } from '@/pages/options/utils';
import Modal from '@/share/components/modal';
import { t } from '@/share/core/browser';
import { VIRTUAL_KEY } from '@/share/core/constant';
import Api from '@/share/pages/api';
import { batchShare, copyAsJson, remove } from '../utils';
import type { GroupMap } from './use-rule-groups';

export default function useSelection(group: GroupMap) {
  const [isEnableSelect, setIsEnableSelect] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const toggleSelect = useCallback(() => {
    setIsEnableSelect(prev => !prev);
    setSelectedKeys([]);
  }, []);

  const handleSelect = useCallback((keys?: Key[]) => {
    setSelectedKeys((keys ?? []).map(String));
  }, []);

  const allRules = useMemo(
    () => Object.values(group).flatMap(it => it.rules),
    [group],
  );

  const selectedRules = useMemo(
    () => allRules.filter(it => selectedKeys.includes(it[VIRTUAL_KEY])),
    [allRules, selectedKeys],
  );

  const toggleSelectAll = useCallback(() => {
    setSelectedKeys(prev =>
      prev.length > 0 ? [] : allRules.map(it => it[VIRTUAL_KEY]),
    );
  }, [allRules]);

  const batchEnable = useCallback(() => {
    if (selectedRules.length === 0) {
      return;
    }
    const setTo = !selectedRules[0].enable;
    selectedRules.forEach(rule => {
      if (rule.enable !== setTo) {
        Api.saveRule({ ...rule, enable: setTo });
      }
    });
  }, [selectedRules]);

  const batchMove = useCallback(() => {
    selectGroup().then(newGroup => {
      selectedRules
        .filter(it => it.group !== newGroup)
        .forEach(it => Api.saveRule({ ...it, group: newGroup }));
    });
  }, [selectedRules]);

  const batchShareRules = useCallback(() => {
    batchShare(selectedRules);
  }, [selectedRules]);

  const batchCopyAsJson = useCallback(() => {
    if (selectedRules.length === 0) {
      return;
    }
    copyAsJson(selectedRules);
  }, [selectedRules]);

  const batchDelete = useCallback(() => {
    Modal.warning({
      title: t('delete_confirm'),
      onOk: async () => {
        selectedRules.forEach(item => remove(item));
      },
    });
  }, [selectedRules]);

  return {
    isEnableSelect,
    selectedKeys,
    selectedRules,
    toggleSelect,
    handleSelect,
    toggleSelectAll,
    batchEnable,
    batchMove,
    batchShare: batchShareRules,
    batchCopy: batchCopyAsJson,
    batchDelete,
  };
}
