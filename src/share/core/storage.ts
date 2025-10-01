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

function createFakeSession() {
  const mapKey = (key: string) => `sess_${key}`;

  const local = getLocal();

  const fakeSessionOnChange = new Map<CallableFunction, any>();

  const mapKeys = (keys: string | string[]) =>
    Array.isArray(keys) ? keys.map(mapKey) : mapKey(keys);

  const onChange = {
    addListener(callback: CallableFunction) {
      const wrappedCallback = (changes: Record<string, any>) => {
        const newChanges = Object.fromEntries(
          Object.entries(changes)
            .filter(([key]) => key.startsWith('sess_'))
            .map(([key, value]) => [key.replace(/^sess_/, ''), value]),
        );
        if (Object.keys(newChanges).length > 0) {
          callback(newChanges);
        }
      };
      fakeSessionOnChange.set(callback, wrappedCallback);
      local.onChanged.addListener(wrappedCallback);
    },
    removeEventListener(callback: CallableFunction) {
      const wrappedCallback = fakeSessionOnChange.get(callback);
      if (wrappedCallback) {
        local.onChanged.removeListener(wrappedCallback);
        fakeSessionOnChange.delete(callback);
      }
    },
    hasEventListener(callback: CallableFunction) {
      return fakeSessionOnChange.has(callback);
    },
  };

  const session = new Proxy(local, {
    get(target, prop) {
      if (prop === 'set') {
        return (items: Record<string, any>) => {
          target.set(
            Object.fromEntries(
              Object.entries(items).map(([key, value]) => [mapKey(key), value]),
            ),
          );
        };
      }
      if (prop === 'get') {
        return (keys: string | string[]) => target.get(mapKeys(keys));
      }
      if (prop === 'remove') {
        return (keys: string | string[]) => target.remove(mapKeys(keys));
      }
      if (prop === 'onChanged') {
        return onChange;
      }
      return Reflect.get(target, prop);
    },
  });

  return session;
}

let fakeSessionStorage: ReturnType<typeof createFakeSession> | undefined;
export function getSession() {
  if ('session' in browser.storage) {
    return browser.storage.session;
  }

  if (!fakeSessionStorage) {
    fakeSessionStorage = createFakeSession();
  }

  return fakeSessionStorage;
}
