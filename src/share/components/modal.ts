import { Modal as SemiModal } from '@douyinfe/semi-ui';
import { currentLocale } from './semi-locale';

const modalLocale = currentLocale.Modal || {};

const Modal = { ...SemiModal };

['confirm', 'warning', 'info', 'success', 'error'].forEach(key => {
  (Modal as any)[key] = (props: any) =>
    (SemiModal as any)[key]({
      okText: modalLocale.confirm,
      cancelText: modalLocale.cancel,
      ...props,
    });
});

export default Modal;
