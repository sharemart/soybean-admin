// utils/url.ts

const BASE_URL = import.meta.env.VITE_SERVICE_BASE_URL || '';

/**
 * 拼接完整URL
 * @param path - 相对路径
 * @param baseUrl - 基础URL（可选）
 * @returns 完整URL
 */
export const joinUrl = (path?: string, baseUrl?: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const base = baseUrl || BASE_URL;
  if (!base) return path;

  const baseClean = base.endsWith('/') ? base : `${base}/`;
  const pathClean = path.startsWith('/') ? path.slice(1) : path;

  return `${baseClean}${pathClean}`;
};

/**
 * 拼接签名图片URL
 */
export const getSignatureUrl = (path?: string): string => {
  return joinUrl(path);
};

/**
 * 拼接图片URL
 */
export const getImageUrl = (path?: string): string => {
  return joinUrl(path);
};
