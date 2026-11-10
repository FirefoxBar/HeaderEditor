import {
  IconCheckList,
  IconDelete,
  IconFavoriteList,
  IconFilter,
  IconList,
  IconPlusCircle,
  IconSend,
  IconSort,
  IconUnlock,
} from '@douyinfe/semi-icons';
import { Button, ButtonGroup, Space, Typography } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import { t } from '@/share/core/browser';

interface RulesToolbarProps {
  isEnableSelect: boolean;
  onToggleSelect: () => void;
  onToggleSelectAll: () => void;
  onBatchEnable: () => void;
  onBatchMove: () => void;
  onBatchShare: () => void;
  onBatchDelete: () => void;
  onToggleFilter: () => void;
  onSortGroups: () => void;
  onAdd: () => void;
}

const RulesToolbar = ({
  isEnableSelect,
  onToggleSelect,
  onToggleSelectAll,
  onBatchEnable,
  onBatchMove,
  onBatchShare,
  onBatchDelete,
  onToggleFilter,
  onSortGroups,
  onAdd,
}: RulesToolbarProps) => (
  <div
    className={css`
      display: flex;
      flex-direction: row;
      padding-bottom: 16px;
    `}
  >
    <Typography.Title heading={2}>{t('rule_list')}</Typography.Title>
    <div style={{ flexGrow: 1 }} />
    <Space>
      <ButtonGroup>
        {isEnableSelect && (
          <>
            <Button
              theme="light"
              type="tertiary"
              onClick={onToggleSelectAll}
              icon={<IconCheckList />}
            >
              {t('select_all')}
            </Button>
            <Button
              theme="light"
              type="tertiary"
              onClick={onBatchEnable}
              icon={<IconUnlock />}
            >
              {t('enable')}
            </Button>
            <Button
              theme="light"
              type="tertiary"
              onClick={onBatchMove}
              icon={<IconFavoriteList />}
            >
              {t('group')}
            </Button>
            <Button
              theme="light"
              type="tertiary"
              onClick={onBatchShare}
              icon={<IconSend />}
            >
              {t('share')}
            </Button>
            <Button
              theme="light"
              type="tertiary"
              onClick={onBatchDelete}
              icon={<IconDelete />}
            >
              {t('delete')}
            </Button>
          </>
        )}
        <Button
          theme="light"
          type="tertiary"
          onClick={onToggleSelect}
          icon={<IconList />}
        >
          {t('batch_mode')}
        </Button>
      </ButtonGroup>
      <Button
        theme="light"
        type="tertiary"
        onClick={onToggleFilter}
        icon={<IconFilter />}
      >
        {t('filter_rules')}
      </Button>
      <Button
        theme="light"
        type="tertiary"
        onClick={onSortGroups}
        icon={<IconSort />}
      >
        {t('sort_groups')}
      </Button>
      <Button
        type="primary"
        theme="solid"
        onClick={onAdd}
        icon={<IconPlusCircle />}
      >
        {t('add')}
      </Button>
    </Space>
  </div>
);

export default RulesToolbar;
