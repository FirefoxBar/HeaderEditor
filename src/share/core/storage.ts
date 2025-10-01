import browser from 'webextension-polyfill';

export function getSync() {
  // For development mode
  if (
    typeof localStorage !== 'undefined' &&
    localStorage.getItem('storage') === 'local'
  ) {
    return browser.storage.local;
  }
  try {
    if ('sync' in browser.storage) {
      return browser.storage.sync;
    }
  } catch (e) {
    // Do nothing
  }
  return browser.storage.local;
}

export function getLocal() {
  return browser.storage.local;
}

export function getSession() {
  if ('session' in browser.storage) {
    return browser.storage.session;
  }

  const mapKey = (key: string) => `sess_${key}`;

  const session = new Proxy(getLocal(), {
    get(target, prop) {
      if (prop === 'set') {
        return (items: Record<string, any>) => {
          target.set(
            Object.fromEntries(
              Object.entries(items).map(([key, value]) => [
                mapKey(key),
                { value },
              ]),
            ),
          );
        };
      }
      if (prop === 'get') {
        return (keys: string | string[]) => {
          return target.get(
            Array.isArray(keys) ? keys.map(mapKey) : mapKey(keys),
          );
        };
      }
      if (prop === 'remove') {
        return (keys: string | string[]) => {
          target.remove(Array.isArray(keys) ? keys.map(mapKey) : mapKey(keys));
        };
      }
      return Reflect.get(target, prop);
    },
  });

  return session;
}
