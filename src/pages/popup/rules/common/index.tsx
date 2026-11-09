import { Typography } from '@douyinfe/semi-ui';
import { withErrorBoundary } from '@/share/components/error-boundary';
import { t } from '@/share/core/browser';
import { ActionContext, useRuleActionsContext } from '../actions';
import Group from './group';
import Rules from './rules';

const Common = withErrorBoundary(() => {
  const actionContext = useRuleActionsContext();
  return (
    <ActionContext.Provider value={actionContext}>
      <div className="main-list">
        <Rules />
        <Group />
      </div>
      <div style={{ flexGrow: 1, minHeight: '20px' }} />
      <Typography.Text
        type="tertiary"
        style={{ textAlign: 'center', padding: '12px', fontSize: '12px' }}
      >
        {t('common_mark_tip')}
      </Typography.Text>
    </ActionContext.Provider>
  );
});

export default Common;
