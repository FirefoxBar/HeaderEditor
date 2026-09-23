import {
  IconCloud,
  IconDownload,
  IconExternalOpen,
  IconUpload,
} from '@douyinfe/semi-icons';
import { Button, Modal, Space, Tag } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { useCallback, useEffect, useState } from 'react';
import { withErrorBoundary } from '@/share/components/error-boundary';
import { t } from '@/share/core/browser';
import { TABLE_NAMES_ARR } from '@/share/core/constant';
import { getSync } from '@/share/core/storage';
import type { BasicRule } from '@/share/core/types';
import { IS_CHROME } from '@/share/core/utils';
import Api from '@/share/pages/api';
import { Toast } from '@/share/pages/toast';
import { type ImportContent, useImportAndExportContext } from './context';

dayjs.extend(localizedFormat);

function getTotalCount(rules: { [key: string]: BasicRule[] }) {
  let count = 0;
  TABLE_NAMES_ARR.forEach(e => {
    count += rules[e].length;
  });
  return count;
}

interface SyncMeta {
  time: number;
  index: number;
}

const browserSync = {
  save(rules: { [key: string]: BasicRule[] }) {
    if (IS_CHROME) {
      const toSave: { [key: string]: any } = {};
      // split
      const limit = chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 500;
      let index = 0;
      while (getTotalCount(rules) > 0) {
        const one: { [key: string]: BasicRule[] } = {};
        TABLE_NAMES_ARR.forEach(e => {
          one[e] = [];
        });
        let t = 0;
        let toPut: BasicRule | null = null;
        while (JSON.stringify(one).length < limit) {
          // find available
          while (TABLE_NAMES_ARR[t] && rules[TABLE_NAMES_ARR[t]].length === 0) {
            t++;
          }
          if (!TABLE_NAMES_ARR[t]) {
            break;
          }
          toPut = rules[TABLE_NAMES_ARR[t]].splice(0, 1)[0];
          one[TABLE_NAMES_ARR[t]].push(toPut);
        }
        if (TABLE_NAMES_ARR[t] && toPut) {
          rules[TABLE_NAMES_ARR[t]].push(toPut);
          one[TABLE_NAMES_ARR[t]].splice(
            one[TABLE_NAMES_ARR[t]].indexOf(toPut),
            1,
          );
        }
        toSave[`backup_${index++}`] = one;
      }
      toSave.backup = {
        time: Date.now(),
        index: index - 1,
      };
      return getSync().set(toSave);
    }

    return getSync().set({
      backup: {
        time: Date.now(),
        index: 0,
      },
      backup_0: rules,
    });
  },
  async getMeta(): Promise<SyncMeta> {
    const e = await getSync().get('backup');
    return e.backup as SyncMeta;
  },
  async getContent(): Promise<ImportContent> {
    const e = await getSync().get('backup');
    const { index } = e.backup as SyncMeta;
    const result: ImportContent = {};
    TABLE_NAMES_ARR.forEach(it => {
      result[it] = [];
    });
    const toGet: string[] = [];
    for (let i = 0; i <= index; i++) {
      toGet.push(`backup_${i}`);
    }
    const res = await getSync().get(toGet);
    toGet.forEach(name => {
      TABLE_NAMES_ARR.forEach(it => {
        result[it] = result[it]!.concat((res[name] as any)[it]);
      });
    });
    return result;
  },
  async clear() {
    const toRemove = ['backup'];
    const e = await getSync().get('backup');
    if (e.backup) {
      const { index } = e.backup as SyncMeta;
      const result: { [key: string]: BasicRule[] } = {};
      TABLE_NAMES_ARR.forEach(it => {
        result[it] = [];
      });
      for (let i = 0; i <= index; i++) {
        toRemove.push(`backup_${i}`);
      }
    }
    await getSync().remove(toRemove);
  },
};

const BrowserSyncComponent = () => {
  const [visible, setVisible] = useState(false);
  const [has, setHas] = useState(false);
  const [time, setTime] = useState(0);

  const { startImport, getExportContent } = useImportAndExportContext();

  const refresh = useCallback(() => {
    browserSync.getMeta().then(r => {
      if (r?.time) {
        setHas(true);
        setTime(r.time);
      }
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleUpload = async () => {
    try {
      const data = await getExportContent();
      await browserSync.save(data);
      await browserSync.getMeta();
      refresh();
    } catch {
      Toast().error('cloud_over_limit');
    }
  };

  const handleDownload = () =>
    browserSync.getContent().then(r => startImport(r));

  const handleDelete = () => {
    browserSync.clear().then(() => {
      setHas(false);
      setTime(0);
    });
    return true;
  };

  const handleHelp = () => Api.openURL(t('url_cloud_backup'));

  return (
    <>
      <Button onClick={() => setVisible(true)} icon={<IconCloud />}>
        {t('browser_sync')}
      </Button>
      <Modal
        className={css`
          width: 480px;
          font-size: 14px;

          .next-tag {
            border: none;

            .next-tag-body {
              padding-left: 0;
            }
          }
        `}
        title={t('cloud_backup')}
        footer={
          <div className="buttons">
            <Button
              type="tertiary"
              onClick={handleHelp}
              icon={<IconExternalOpen />}
            >
              {t('help')}
            </Button>
            <Button
              theme="solid"
              type="primary"
              onClick={handleDownload}
              disabled={!has}
              icon={<IconDownload />}
            >
              {t('download')}
            </Button>
            <Button
              theme="solid"
              type="primary"
              onClick={handleUpload}
              icon={<IconUpload />}
            >
              {t('upload')}
            </Button>
          </div>
        }
        visible={visible}
        onCancel={() => setVisible(false)}
      >
        {has ? (
          <Tag closable size="large" onClose={handleDelete}>
            {t('cloud_backup_at', dayjs(time).format('lll'))}
          </Tag>
        ) : (
          t('cloud_no_backup')
        )}
      </Modal>
    </>
  );
};

export default withErrorBoundary(BrowserSyncComponent);
