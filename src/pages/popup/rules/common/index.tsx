import { Typography } from '@douyinfe/semi-ui';
import { t } from '@/share/core/utils';
import Group from './group';
import Rules from './rules';

const Common = () => (
  <>
    <Rules />
    <Group />
    <div style={{ flexGrow: 1, minHeight: '20px' }} />
    <Typography.Text
      type="tertiary"
      style={{ textAlign: 'center', padding: '12px', fontSize: '12px' }}
    >
      {t('common_mark_tip')}
    </Typography.Text>
  </>
);

export default Common;
