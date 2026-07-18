import type { RecentRoute } from '../shared/types';
import { logDebug } from '../shared/logger';
import { getLocalStorageArea, storageGet, storageSet } from './storageArea';

export const RECENT_ROUTES_STORAGE_KEY = 'recentRoutes';
export const MAX_RECENT_ROUTES = 8;

export async function getRecentRoutes(): Promise<RecentRoute[]> {
  try {
    const routes = await storageGet<RecentRoute[]>(
      getLocalStorageArea(),
      RECENT_ROUTES_STORAGE_KEY,
    );

    return Array.isArray(routes) ? routes : [];
  } catch (error) {
    logDebug('Could not read recent routes.', error);
    return [];
  }
}

export async function addRecentRoute(route: RecentRoute): Promise<void> {
  const currentRoutes = await getRecentRoutes();
  const nextRoutes = [route, ...currentRoutes].slice(0, MAX_RECENT_ROUTES);

  try {
    await storageSet(getLocalStorageArea(), RECENT_ROUTES_STORAGE_KEY, nextRoutes);
  } catch (error) {
    logDebug('Could not persist recent route.', error);
  }
}
