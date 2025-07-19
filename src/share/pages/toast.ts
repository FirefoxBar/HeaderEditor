import { Toast as SemiToast, ToastFactory } from '@douyinfe/semi-ui';

export const BottomToast = ToastFactory.create({
  top: 'auto',
  bottom: 0,
});

export const Toast = () => {
  if (document.body.getAttribute('data-page-name') === 'popup') {
    return BottomToast;
  }
  return SemiToast;
};
