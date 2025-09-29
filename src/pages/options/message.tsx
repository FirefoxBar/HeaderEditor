import { Button, Notification } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import { useEffect } from 'react';
import Modal from '@/share/components/modal';
import SessionMessage, {
  type SessionMessageItem,
} from '@/share/core/session-message';
import { t } from '@/share/core/utils';

export const Message = () => {
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
                  Modal.info({
                    title: item.title,
                    content: item.more,
                    zIndex: 1015,
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

  return <div />;
};
