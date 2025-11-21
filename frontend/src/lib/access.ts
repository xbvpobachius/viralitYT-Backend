const ACCESS_STORAGE_KEY = "viralityt_access_token";
export const ACCESS_PASSWORD = "100kcommingsoon";

const hasWindow = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

export const hasAccess = (): boolean => {
  if (!hasWindow()) return false;
  return localStorage.getItem(ACCESS_STORAGE_KEY) === ACCESS_PASSWORD;
};

export const persistAccess = (): void => {
  if (!hasWindow()) return;
  localStorage.setItem(ACCESS_STORAGE_KEY, ACCESS_PASSWORD);
};

export const clearAccess = (): void => {
  if (!hasWindow()) return;
  localStorage.removeItem(ACCESS_STORAGE_KEY);
};

