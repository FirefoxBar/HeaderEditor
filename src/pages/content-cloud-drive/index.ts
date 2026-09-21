import { APIs } from '@/share/core/constant';

const main = () => {
  const { hostname, pathname, search, hash } = window.location;
  // check if requested by header-editor
  if (
    !search.includes('state=header-editor') &&
    !hash.includes('state=header-editor')
  ) {
    return;
  }
  const data: any = {
    type: '',
  };
  switch (hostname) {
    case 'login.microsoftonline.com': {
      if (!window.location.pathname.includes('common/oauth2/nativeclient')) {
        return;
      }
      data.type = 'onedrive';
      const query = new URLSearchParams(search);
      data.code = query.get('code') || '';
      break;
    }
    case 'ext.firefoxcn.net':
      if (pathname.includes('login/callback/google.html')) {
        data.type = 'google-drive';
        const hashQuery = new URLSearchParams(hash.substring(1));
        data.accessToken = hashQuery.get('access_token') || '';
        data.expireIn = hashQuery.get('expires_in') || '';
        break;
      }
  }
  chrome.runtime.sendMessage({
    method: APIs.ON_DRIVE_LOGIN,
    ...data,
  });
};

main();
