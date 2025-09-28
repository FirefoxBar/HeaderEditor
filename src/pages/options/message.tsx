import { Notification } from '@douyinfe/semi-ui';
import { useEffect } from 'react';
import SessionMessage, {
  type SessionMessageItem,
} from '@/share/core/session-message';

export const Message = () => {
  useEffect(() => {
    const showMessage = (item: SessionMessageItem) => {
      Notification[item.type]({
        title: item.title,
        content: item.content,
        theme: 'light',
        position: 'bottomRight',
      });
    };

    SessionMessage.get().then(res => res.forEach(item => showMessage(item)));
    SessionMessage.watch(message => message.forEach(item => showMessage(item)));
  }, []);

  return <div />;
};
