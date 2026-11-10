import { IconCode, IconFolderOpen, IconSave } from '@douyinfe/semi-icons';
import { Button, TextArea } from '@douyinfe/semi-ui';
import { getExportName } from '@/pages/options/utils';
import { withErrorBoundary } from '@/share/components/error-boundary';
import Modal from '@/share/components/modal';
import { t } from '@/share/core/browser';
import * as file from '@/share/pages/file';
import { Toast } from '@/share/pages/toast';
import { useImportAndExportContext } from './context';

const LocalFile = () => {
  const { startImport, getExportContent } = useImportAndExportContext();

  // 文件导入与粘贴导入共用解析流程，返回是否解析成功
  const parseAndImport = (content: string) => {
    try {
      startImport(JSON.parse(content));
      return true;
    } catch (e) {
      Toast().error((e as Error).message);
      return false;
    }
  };

  const handleImport = () => {
    file.load('.json').then(parseAndImport);
  };

  const handlePasteImport = () => {
    let content = '';
    Modal.confirm({
      title: t('import_paste_json'),
      icon: null,
      size: 'large',
      content: (
        <TextArea
          autoFocus
          autosize={{ minRows: 10, maxRows: 20 }}
          placeholder={t('import_paste_json_placeholder')}
          onChange={value => (content = value)}
        />
      ),
      onOk: () =>
        // 返回 rejected Promise 时 Semi 不会关闭弹窗，便于修正粘贴内容
        parseAndImport(content) ? undefined : Promise.reject(),
    });
  };

  const handleExport = async () => {
    file.save(
      JSON.stringify(await getExportContent(), null, '\t'),
      getExportName(),
    );
  };

  return (
    <>
      <Button onClick={handleExport} icon={<IconSave />}>
        {t('export')}
      </Button>
      <Button onClick={handleImport} icon={<IconFolderOpen />}>
        {t('import')}
      </Button>
      <Button onClick={handlePasteImport} icon={<IconCode />}>
        {t('import_paste_json')}
      </Button>
    </>
  );
};

export default withErrorBoundary(LocalFile);
