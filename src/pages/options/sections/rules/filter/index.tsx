import { IconChevronUp, IconDelete, IconSave } from '@douyinfe/semi-icons';
import {
  Button,
  Dropdown,
  Input,
  Modal,
  SideSheet,
  Table,
  Toast,
} from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import { useRequest } from 'ahooks';
import { useEffect, useRef, useState } from 'react';
import RequestMock, {
  type RequestMockApi,
} from '@/pages/options/components/request-mock';
import { t } from '@/share/core/browser';
import { EVENTs, VIRTUAL_KEY } from '@/share/core/constant';
import notify from '@/share/core/notify';
import { filter, initRule } from '@/share/core/rule-utils';
import type { InitdRule, RuleWithVirtualKey } from '@/share/core/types';
import { getVirtualKey } from '@/share/core/utils';
import Api from '@/share/pages/api';
import { useRuleColumns } from '../rule-columns';
import { compileRe2 } from '../utils';
import {
  loadSavedFilters,
  removeFilter,
  type SavedFilter,
  saveFilter,
} from './saved';

interface RuleFilterPanelProps {
  visible: boolean;
  onClose: () => void;
  onRuleEdit: (rule: RuleWithVirtualKey) => void;
  onRulePreview: (rule: RuleWithVirtualKey) => void;
}

type InitdRuleWithVirtualKey = InitdRule & RuleWithVirtualKey;

const loadRules = () =>
  Api.getAllRules().then(
    res =>
      Object.values(res)
        .flat()
        .map(x => {
          try {
            const initd = initRule(x, true);
            // 与测试面板一致：DNR 规则编译 RE2，失败则回退 JS RegExp
            compileRe2(initd);
            return initd;
          } catch (e) {
            console.error('[rule-filter] Init rule failed', x, e);
            return null;
          }
        })
        .filter(Boolean)
        .map(x => ({
          ...x,
          [VIRTUAL_KEY]: getVirtualKey(x!),
        })) as InitdRuleWithVirtualKey[],
  );

/**
 * 规则筛选侧边栏
 *
 * 默认仅展示 URL 输入框，输入即自动筛选；
 * 展开「高级」后 URL 输入不再自动筛选，需手动点击「筛选」。
 */
const RuleFilterPanel = ({
  visible,
  onClose,
  onRuleEdit,
  onRulePreview,
}: RuleFilterPanelProps) => {
  const [savedList, setSavedList] = useState<SavedFilter[]>([]);
  const [saveVisible, setSaveVisible] = useState(false);
  const [saveName, setSaveName] = useState('');

  const requestMockApi = useRef<RequestMockApi>();

  const getRulesRef = useRef<Promise<InitdRuleWithVirtualKey[]>>();

  const tableColumns = useRuleColumns({
    onRuleEdit,
    onRulePreview,
    // 侧边栏宽度有限，固定隐藏规则类型列
    showRuleType: false,
  });

  const {
    run,
    data: results,
    loading,
  } = useRequest(
    async () => {
      if (!getRulesRef.current) {
        return;
      }
      const options = requestMockApi.current?.getValues();
      if (!options || !options.url) {
        return;
      }
      return filter(
        await getRulesRef.current,
        options,
      ) as InitdRuleWithVirtualKey[];
    },
    {
      manual: true,
      debounceWait: 300,
    },
  );

  const handleRun = () => {
    const url = requestMockApi.current?.getUrl().trim();
    if (!url) {
      Toast.warning(t('url_required'));
      return;
    }
    run();
  };

  const handleReset = () => {
    // RequestMock 内部已重置 URL/表单，这里只清空筛选结果
    run();
  };

  const handleOpenSave = () => {
    if (!requestMockApi.current?.getUrl().trim()) {
      Toast.warning(t('url_required'));
      return;
    }
    setSaveName('');
    setSaveVisible(true);
  };

  const handleSaveConfirm = async () => {
    const value = requestMockApi.current?.getValues();
    if (!value) {
      return;
    }
    const name = saveName.trim();
    if (!name) {
      Toast.warning(t('name'));
      return;
    }
    await saveFilter({
      name,
      filter: value,
    });
    setSaveVisible(false);
    Toast.success(t('saved'));
    setSavedList(await loadSavedFilters());
  };

  const handleLoadSaved = (item: SavedFilter) => {
    const hasAdvanced = Boolean(
      item.filter.method ||
        item.filter.resourceType ||
        item.filter.responseHeaders?.length,
    );
    requestMockApi.current?.setAdvanced(hasAdvanced);
    requestMockApi.current?.setValues(item.filter);
    setTimeout(() => {
      run();
    }, 300);
  };

  const handleRemoveSaved = async (id: string) => {
    await removeFilter(id);
    setSavedList(await loadSavedFilters());
  };

  // 打开时加载已保存的筛选项
  useEffect(() => {
    if (visible) {
      getRulesRef.current = loadRules();
      loadSavedFilters().then(setSavedList);
    } else {
      getRulesRef.current = undefined;
      setSavedList([]);
    }
  }, [visible]);

  useEffect(() => {
    const handleRuleUpdate = () => {
      if (getRulesRef.current) {
        getRulesRef.current = loadRules();
        getRulesRef.current.then(run);
      }
    };

    notify.event.on(EVENTs.RULE_UPDATE, handleRuleUpdate);
    notify.event.on(EVENTs.RULE_DELETE, handleRuleUpdate);

    return () => {
      notify.event.off(EVENTs.RULE_UPDATE, handleRuleUpdate);
      notify.event.off(EVENTs.RULE_DELETE, handleRuleUpdate);
    };
  }, []);

  return (
    <SideSheet
      placement="right"
      visible={visible}
      onCancel={onClose}
      title={t('filter_rules')}
      maskClosable={false}
      width="100vw"
      className={css`
        .semi-sidesheet-inner {
          width: 100vw;
          max-width: 640px;
        }

        .semi-form {
          .semi-form-field-main {
            > .semi-select {
              width: 100%;
            }
          }
        }
      `}
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          {savedList.length > 0 && (
            <Dropdown
              position="topRight"
              autoAdjustOverflow
              menu={[
                ...savedList.map(item => ({
                  node: 'item' as const,
                  name: item.name,
                  onClick: () => handleLoadSaved(item),
                })),
                { node: 'divider' as const },
                ...savedList.map(item => ({
                  node: 'item' as const,
                  name: t('filter_delete_saved', item.name),
                  type: 'danger' as const,
                  icon: <IconDelete />,
                  onClick: () => handleRemoveSaved(item.id),
                })),
              ]}
            >
              <Button icon={<IconChevronUp />} iconPosition="right">
                {t('filter_saved_list')}
              </Button>
            </Dropdown>
          )}
          <Button icon={<IconSave />} onClick={handleOpenSave}>
            {t('filter_save_item')}
          </Button>
        </div>
      }
    >
      <RequestMock
        submitText={t('filter_rules')}
        onSubmit={handleRun}
        getApi={api => (requestMockApi.current = api)}
        onReset={handleReset}
        onUrlChange={() => {
          if (requestMockApi.current?.getAdvanced()) {
            return;
          }
          run();
        }}
      />
      <Table
        rowKey={VIRTUAL_KEY}
        dataSource={results}
        size="small"
        pagination={false}
        columns={tableColumns}
        style={{ tableLayout: 'fixed' }}
        loading={loading}
      />
      <Modal
        title={t('filter_save_item')}
        visible={saveVisible}
        onOk={handleSaveConfirm}
        onCancel={() => setSaveVisible(false)}
        okText={t('save')}
        cancelText={t('cancel')}
      >
        <div style={{ marginBottom: 8 }}>{t('name')}</div>
        <Input
          value={saveName}
          onChange={setSaveName}
          placeholder={t('name')}
        />
      </Modal>
    </SideSheet>
  );
};

export default RuleFilterPanel;
