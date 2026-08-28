import { Button, Notification, Space, Typography } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import { useEffect } from 'react';
import browser from 'webextension-polyfill';
import { withErrorBoundary } from '@/share/components/error-boundary';
import Modal from '@/share/components/modal';
import { t } from '@/share/core/browser';
import SessionMessage, {
  type SessionMessageItem,
} from '@/share/core/session-message';

function shouldShowEdgeUpgradeMessage() {
  if (MANIFEST_VER !== 'v2') {
    return false;
  }
  try {
    if (localStorage.getItem('doNotShowEdgeUpgradeTip')) {
      return false;
    }
  } catch (_) {
    // ignore
  }
  try {
    // is edge
    if (!navigator.userAgent.includes('Edg/')) {
      return false;
    }
    // is store channel
    const updateUrl = (browser.runtime.getManifest() as any).update_url || '';
    return updateUrl.includes('https://edge.microsoft.com/');
  } catch (_) {
    // ignore
  }
  return false;
}

export const Message = withErrorBoundary(() => {
  useEffect(() => {
    const showMessage = (item: SessionMessageItem) => {
      Notification[item.type]({
        className: css`
          max-width: 50vw;

          .semi-notification-notice-content {
            word-break: break-all;
            white-space: pre-wrap;
          }
        `,
        title: item.title,
        content: (
          <>
            <div>{item.content}</div>
            {item.more && (
              <Button
                theme="borderless"
                onClick={() =>
                  Modal[item.type]({
                    title: item.title,
                    content: item.more,
                    zIndex: 1015,
                    hasCancel: false,
                    className: css`
                      .semi-modal-confirm-content {
                        word-break: break-all;
                        white-space: pre-wrap;
                      }
                    `,
                  })
                }
              >
                {t('more_information')}
              </Button>
            )}
          </>
        ),
        theme: 'light',
        position: 'bottomRight',
        duration: 0,
        onCloseClick: () => {
          SessionMessage.remove(item.id);
        },
      });
    };

    SessionMessage.get().then(res => res.forEach(item => showMessage(item)));
    const remove = SessionMessage.watch(message =>
      message.forEach(item => showMessage(item)),
    );

    return () => {
      remove();
    };
  }, []);

  useEffect(() => {
    if (shouldShowEdgeUpgradeMessage()) {
      const m = Notification.info({
        duration: 0,
        theme: 'light',
        position: 'bottomRight',
        title: t('edge_upgrade_tip'),
        content: (
          <Space>
            <Typography.Text
              link={{
                href: 'https://github.com/FirefoxBar/HeaderEditor/issues/357',
                target: '_blank',
              }}
            >
              {t('view')}
            </Typography.Text>
            <Typography.Text
              link
              onClick={() => {
                localStorage.setItem('doNotShowEdgeUpgradeTip', 'true');
                Notification.close(m);
              }}
            >
              {t('do_not_show_again')}
            </Typography.Text>
          </Space>
        ),
      });
    }
  }, []);

  return <div />;
});
