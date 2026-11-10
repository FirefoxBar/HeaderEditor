import { IconArrowDown, IconArrowUp } from '@douyinfe/semi-icons';
import { Button, List, Modal, Space } from '@douyinfe/semi-ui';
import { useEffect, useState } from 'react';
import { t } from '@/share/core/browser';

interface GroupSortModalProps {
  visible: boolean;
  names: string[];
  onSave: (names: string[]) => void;
  onClose: () => void;
}

const GroupSortModal = ({
  visible,
  names,
  onSave,
  onClose,
}: GroupSortModalProps) => {
  const [draft, setDraft] = useState<string[]>(names);

  useEffect(() => {
    if (visible) {
      setDraft(names);
    }
  }, [visible, names]);

  const move = (index: number, offset: number) => {
    setDraft(prev => {
      const target = index + offset;
      if (target < 0 || target >= prev.length) {
        return prev;
      }
      const result = [...prev];
      [result[index], result[target]] = [result[target], result[index]];
      return result;
    });
  };

  const sortByName = (descending: boolean) => {
    setDraft(prev =>
      [...prev].sort((a, b) =>
        descending ? b.localeCompare(a) : a.localeCompare(b),
      ),
    );
  };

  return (
    <Modal
      title={t('sort_groups')}
      visible={visible}
      onOk={() => {
        onSave(draft);
        onClose();
      }}
      onCancel={onClose}
    >
      <Space style={{ marginBottom: 12 }}>
        <Button theme="light" type="tertiary" onClick={() => sortByName(false)}>
          {t('sort_name_asc')}
        </Button>
        <Button theme="light" type="tertiary" onClick={() => sortByName(true)}>
          {t('sort_name_desc')}
        </Button>
      </Space>
      <List
        dataSource={draft}
        renderItem={(name, index) => (
          <List.Item
            main={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flexGrow: 1 }}>{name}</span>
                <Button
                  theme="borderless"
                  type="tertiary"
                  icon={<IconArrowUp />}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={t('move_up')}
                />
                <Button
                  theme="borderless"
                  type="tertiary"
                  icon={<IconArrowDown />}
                  disabled={index === draft.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={t('move_down')}
                />
              </div>
            }
          />
        )}
      />
    </Modal>
  );
};

export default GroupSortModal;
