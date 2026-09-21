import { IconFolderOpen, IconSave } from '@douyinfe/semi-icons';
import { Button, Space, Toast } from '@douyinfe/semi-ui';
import { getExportName } from '@/pages/options/utils';
import { withErrorBoundary } from '@/share/components/error-boundary';
import { t } from '@/share/core/browser';
import * as file from '@/share/pages/file';
import { useImportAndExportContext } from './context';

const LocalFile = () => {
  const { startImport, getExportContent } = useImportAndExportContext();

  const handleImport = () => {
    file.load('.json').then(content => {
      try {
        startImport(JSON.parse(content));
      } catch (e) {
        Toast.error((e as Error).message);
      }
    });
  };

  const handleExport = async () => {
    file.save(
      JSON.stringify(await getExportContent(), null, '\t'),
      getExportName(),
    );
  };

  return (
    <Space>
      <Button onClick={handleExport} icon={<IconSave />}>
        {t('export')}
      </Button>
      <Button onClick={handleImport} icon={<IconFolderOpen />}>
        {t('import')}
      </Button>
    </Space>
  );
};

export default withErrorBoundary(LocalFile);
