import { List, Select, Slider, Switch, Typography } from '@douyinfe/semi-ui';
import { useGetState } from 'ahooks';
import { merge } from 'lodash-es';
import { useCallback, useEffect } from 'react';
import { IS_ANDROID, IS_SUPPORT_STREAM_FILTER, t } from '@/share/core/browser';
import { defaultPrefValue } from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import { prefs } from '@/share/core/prefs';
import type { PrefValue } from '@/share/core/types';
import { IS_FIREFOX } from '@/share/core/utils';
import Api from '@/share/pages/api';

export interface PrefItem {
  langKey: string;
  type: 'switch' | 'select' | 'slider';
  optionList?: Array<{ label: string; value: string }>;
  disabled?: boolean;
  multiple?: boolean;
  min?: number;
  max?: number;
}

const prefItems: Partial<Record<keyof PrefValue, PrefItem>> = {
  'manage-collapse-group': {
    langKey: 'manage_collapse_group',
    type: 'switch',
  },
  'show-common-header': {
    langKey: 'display_common_header',
    type: 'switch',
  },
  'include-headers': {
    langKey: 'include_header_in_custom_function',
    type: 'switch',
    disabled: !ENABLE_EVAL,
  },
  'modify-body': {
    langKey: 'modify_body',
    type: 'switch',
    disabled: IS_FIREFOX && !IS_SUPPORT_STREAM_FILTER,
  },
  'is-debug': {
    langKey: 'debug_mode_enable',
    type: 'switch',
  },
  'rule-switch': {
    langKey: 'rule_switch',
    type: 'switch',
  },
  'rule-history': {
    langKey: 'rule_history',
    type: 'switch',
  },
  'quick-edit': {
    langKey: 'quick_edit',
    type: 'switch',
  },
  'dark-mode': {
    langKey: 'dark_mode',
    type: 'select',
    optionList: [
      {
        label: t('auto'),
        value: 'auto',
      },
      {
        label: t('enable'),
        value: 'on',
      },
      {
        label: t('disable'),
        value: 'off',
      },
    ],
  },
  'popup-show-rules': {
    langKey: 'show_rules_on_popup',
    type: 'select',
    optionList: [
      {
        label: t('marked_as_common'),
        value: 'common',
      },
      {
        label: t('all_rules'),
        value: 'all',
      },
    ],
  },
  'show-quick-preview': {
    langKey: 'showQuickPreview',
    type: 'select',
    multiple: true,
    optionList: [
      {
        label: t('popupPanel'),
        value: 'popup',
      },
      {
        label: t('manage'),
        value: 'manage',
      },
    ],
  },
  'popup-height': {
    langKey: 'height',
    type: 'slider',
    min: 300,
    max: 600,
    disabled: IS_ANDROID,
  },
  'popup-width': {
    langKey: 'width',
    type: 'slider',
    min: 200,
    max: 800,
    disabled: IS_ANDROID,
  },
};

export const createPrefsComponent = (
  keys: Array<keyof PrefValue>,
  items: Partial<Record<keyof PrefValue, PrefItem>> = {},
) => {
  const finalItems = merge(prefItems, items);

  const Prefs = () => {
    const [state, setState, getState] = useGetState<Partial<PrefValue>>({
      ...defaultPrefValue,
    });

    useEffect(() => {
      const handleUpdate = (key: keyof PrefValue, val: any) => {
        if (!keys.includes(key)) {
          return;
        }
        if (getState()[key] === val) {
          return;
        }
        setState(prevState => ({
          ...prevState,
          [key]: val,
        }));
      };

      prefs.ready(() => {
        const newPrefs: any = {};
        keys.forEach(it => {
          newPrefs[it] = prefs.get(it as keyof PrefValue);
        });
        setState(newPrefs);
      });
      emitter.on(emitter.EVENT_PREFS_UPDATE, handleUpdate);

      return () => {
        emitter.off(emitter.EVENT_PREFS_UPDATE, handleUpdate);
      };
    }, []);

    const handleValueChange = useCallback((name: string, value: any) => {
      setState(prevState => ({
        ...prevState,
        [name]: value,
      }));
    }, []);

    const handleChange = useCallback((name: string, value: any) => {
      Api.setPrefs(name, value);
      prefs.set(name, value);
      setState(prevState => ({
        ...prevState,
        [name]: value,
      }));
    }, []);

    return (
      <List
        dataSource={keys}
        renderItem={key => {
          const item = finalItems[key]!;
          const label = t(item.langKey);
          const help = t(`${item.langKey}_help`, undefined, '');

          let extra = null;
          switch (item.type) {
            case 'slider':
              extra = (
                <Slider
                  min={item.min}
                  max={item.max}
                  onMouseUp={() => handleChange(key, getState()[key])}
                  onChange={v => handleValueChange(key, v)}
                  value={state[key as keyof PrefValue] as number}
                  disabled={item.disabled}
                  style={{ width: 240 }}
                />
              );
              break;
            case 'select':
              extra = (
                <Select
                  optionList={item.optionList}
                  onChange={v => handleChange(key, v)}
                  value={state[key as keyof PrefValue] as any}
                  disabled={item.disabled}
                  multiple={item.multiple}
                />
              );
              break;
            case 'switch':
              extra = (
                <Switch
                  checked={state[key as keyof PrefValue] as boolean}
                  onChange={v => handleChange(key, Boolean(v))}
                  disabled={item.disabled}
                />
              );
              break;
          }

          return (
            <List.Item
              key={key}
              main={
                <div className="list-item">
                  <Typography.Text className="title">{label}</Typography.Text>
                  {help && (
                    <Typography.Text type="quaternary" className="content">
                      {help}
                    </Typography.Text>
                  )}
                </div>
              }
              extra={extra}
            />
          );
        }}
      />
    );
  };

  return Prefs;
};
