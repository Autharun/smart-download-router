export function getSyncStorageArea(): chrome.storage.StorageArea {
  return chrome.storage.sync ?? chrome.storage.local;
}

export function getLocalStorageArea(): chrome.storage.StorageArea {
  return chrome.storage.local;
}

export async function storageGet<T>(
  area: chrome.storage.StorageArea,
  key: string,
): Promise<T | undefined> {
  const items = await storageGetRaw(area, key);
  return items[key] as T | undefined;
}

export function storageSet<T>(
  area: chrome.storage.StorageArea,
  key: string,
  value: T,
): Promise<void> {
  return new Promise((resolve, reject) => {
    area.set({ [key]: value }, () => {
      const error = chrome.runtime.lastError;

      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve();
    });
  });
}

async function storageGetRaw(
  area: chrome.storage.StorageArea,
  key: string,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    area.get(key, (items) => {
      const error = chrome.runtime.lastError;

      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve(items as Record<string, unknown>);
    });
  });
}
