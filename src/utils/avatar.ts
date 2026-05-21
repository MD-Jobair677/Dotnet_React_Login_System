export const avatarUpdatedEvent = "avatarPathUpdated";

const baseUrl = import.meta.env.VITE_IMG_BASE_URL || "http://localhost:8000";
const defaultAvatarPath = "/images/user/owner.jpg";

export const normalizeAvatarPath = (path?: string | null) => {
  if (!path) return defaultAvatarPath;

  if (path.startsWith(baseUrl)) {
    return path.slice(baseUrl.length) || defaultAvatarPath;
  }

  return path.startsWith("/") || path.startsWith("http") ? path : `/${path}`;
};

export const getAvatarUrl = (path?: string | null) => {
  const normalizedPath = normalizeAvatarPath(path);

  if (normalizedPath.startsWith("http")) {
    return normalizedPath;
  }

  return `${baseUrl}${normalizedPath}`;
};

export const getStoredAvatarPath = () =>
  normalizeAvatarPath(localStorage.getItem("avatarPath"));

export const saveAvatarPath = (path?: string | null) => {
  const normalizedPath = normalizeAvatarPath(path);
  localStorage.setItem("avatarPath", normalizedPath);
  window.dispatchEvent(new Event(avatarUpdatedEvent));

  return normalizedPath;
};
