import { IconCustomize, IconDelete, IconSave } from '@douyinfe/semi-icons';
import {
  Button,
  Dropdown,
  Form,
  Input,
  Modal,
  SideSheet,
  Space,
  Table,
  Toast,
  Typography,
} from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { css } from '@emotion/css';
import { useRequest } from 'ahooks';
import { useEffect, useRef, useState } from 'react';
import HeaderField from '@/share/components/header-field';
import { t } from '@/share/core/browser';
import { VIRTUAL_KEY } from '@/share/core/constant';
import { filter, initRule } from '@/share/core/rule-utils';
import type {
  InitdRule,
  RuleFilterOptions,
  RuleWithVirtualKey,
} from '@/share/core/types';
import { getVirtualKey } from '@/share/core/utils';
import Api from '@/share/pages/api';
import { METHOD_LIST, RESOURCE_TYPE_LIST } from '../edit/options';
import { useRuleColumns } from '../rule-columns';
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

interface FilterFormValues {
  method?: string;
  resourceType?: string;
  responseHeaders?: Array<{ name?: string; value?: string }>;
}

type InitdRuleWithVirtualKey = InitdRule & RuleWithVirtualKey;

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
  const formApi = useRef<FormApi<FilterFormValues>>();
  const [advanced, setAdvanced] = useState(false);
  // URL 用受控 state，输入变化才会触发下方的防抖自动筛选
  const [url, setUrl] = useState('');
  const [savedList, setSavedList] = useState<SavedFilter[]>([]);
  const [saveVisible, setSaveVisible] = useState(false);
  const [saveName, setSaveName] = useState('');

  const getRulesRef = useRef<Promise<InitdRuleWithVirtualKey[]>>();

  const tableColumns = useRuleColumns({
    onRuleEdit,
    onRulePreview,
    // 侧边栏宽度有限，固定隐藏规则类型列
    showRuleType: false,
  });

  const getFormValues = (): FilterFormValues =>
    formApi.current?.getValues() || {};

  const {
    run,
    data: results,
    loading,
  } = useRequest(
    async () => {
      if (!getRulesRef.current) {
        return;
      }
      const trimmed = url.trim();
      if (!trimmed) {
        return;
      }
      const options: RuleFilterOptions = { url: trimmed };
      // 高级字段默认态下隐藏，不参与匹配
      if (advanced) {
        const { method, resourceType, responseHeaders } = getFormValues();
        if (method) {
          options.method = method.toLowerCase();
        }
        if (resourceType) {
          options.resourceType = resourceType as NonNullable<
            RuleFilterOptions['resourceType']
          >;
        }
        // 空 name 的行不参与匹配
        const validHeaders = (responseHeaders || [])
          .filter(it => Boolean(it?.name))
          .map(it => ({
            name: String(it.name).toLowerCase(),
            value: it.value,
          }));
        if (validHeaders.length > 0) {
          options.responseHeaders = validHeaders;
        }
      }
      return filter(
        await getRulesRef.current,
        options,
      ) as InitdRuleWithVirtualKey[];
    },
    {
      manual: Boolean(advanced),
      debounceWait: 300,
      refreshDeps: advanced ? [] : [url],
    },
  );

  const handleRun = () => {
    if (!url.trim()) {
      Toast.warning(t('filter_url_required'));
      return;
    }
    run();
  };

  const handleReset = () => {
    formApi.current?.reset();
    setUrl('');
  };

  const handleOpenSave = () => {
    if (!url.trim()) {
      Toast.warning(t('filter_url_required'));
      return;
    }
    setSaveName('');
    setSaveVisible(true);
  };

  const handleSaveConfirm = async () => {
    const name = saveName.trim();
    if (!name) {
      Toast.warning(t('name'));
      return;
    }
    const values = getFormValues();
    // 默认态下高级字段隐藏，保存时不带上
    const responseHeaders = advanced
      ? (values.responseHeaders || [])
          .filter(it => Boolean(it?.name))
          .map(it => ({ name: String(it.name), value: it.value }))
      : [];
    await saveFilter({
      name,
      url: url.trim(),
      method: advanced ? values.method || undefined : undefined,
      resourceType: advanced ? values.resourceType || undefined : undefined,
      responseHeaders: responseHeaders.length > 0 ? responseHeaders : undefined,
    });
    setSaveVisible(false);
    Toast.success(t('saved'));
    setSavedList(await loadSavedFilters());
  };

  const handleLoadSaved = (item: SavedFilter) => {
    const hasAdvanced = Boolean(
      item.method || item.resourceType || item.responseHeaders?.length,
    );
    const api = formApi.current;
    api?.setValue('method', item.method || undefined);
    api?.setValue('resourceType', item.resourceType || undefined);
    api?.setValue(
      'responseHeaders',
      (item.responseHeaders || []).map(it => ({ ...it })),
    );
    setUrl(item.url);
    // 载入属显式操作：有高级字段时自动展开并立即筛选，否则走自动筛选
    setAdvanced(hasAdvanced);
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
      loadSavedFilters().then(setSavedList);
      getRulesRef.current = Api.getAllRules().then(
        res =>
          Object.values(res)
            .flat()
            .map(x => {
              try {
                return initRule(x, true);
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
    }
  }, [visible]);

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

        .url-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;

          > .semi-input-wrapper {
            flex: 1;
          }
        }
      `}
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          {savedList.length > 0 && (
            <Dropdown
              position="bottomRight"
              trigger="click"
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
              <Button>{t('filter_saved_list')}</Button>
            </Dropdown>
          )}
          <Button icon={<IconSave />} onClick={handleOpenSave}>
            {t('filter_save_item')}
          </Button>
        </div>
      }
    >
      <Form<FilterFormValues>
        labelCol={{ fixedSpan: 4 }}
        getFormApi={api => {
          formApi.current = api;
        }}
        labelPosition="left"
        labelAlign="right"
        labelWidth={140}
        initValues={{}}
      >
        <div className="url-input-wrapper">
          <Input
            value={url}
            onChange={setUrl}
            placeholder="https://..."
            showClear
          />
          <Button
            icon={<IconCustomize />}
            onClick={() => setAdvanced(!advanced)}
          >
            {t('filter_advanced')}
          </Button>
        </div>
        {advanced && (
          <>
            <Form.Select
              label={t('match_method')}
              field="method"
              showClear
              optionList={METHOD_LIST}
            />
            <Form.Select
              label={t('match_resourceType')}
              field="resourceType"
              showClear
              optionList={RESOURCE_TYPE_LIST}
            />
            <Form.Slot label={t('response_headers')}>
              <HeaderField field="responseHeaders" type="response" />
            </Form.Slot>
            <Form.Slot>
              <Space>
                <Button type="primary" theme="solid" onClick={handleRun}>
                  {t('filter_rules')}
                </Button>
                <Button theme="light" type="tertiary" onClick={handleReset}>
                  {t('reset')}
                </Button>
              </Space>
            </Form.Slot>
          </>
        )}
      </Form>
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
        <Typography.Text type="tertiary" style={{ marginTop: 12 }}>
          {url}
        </Typography.Text>
      </Modal>
    </SideSheet>
  );
};

export default RuleFilterPanel;
