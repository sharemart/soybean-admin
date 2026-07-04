/**
 * 时间格式化工具
 */

/**
 * 格式化时间戳为指定格式
 * @param timestamp - 时间戳（秒或毫秒）
 * @param format - 格式模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的时间字符串
 */
export const formatTime = (timestamp: number | null | undefined, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!timestamp) return '-';

  // 判断时间戳是秒还是毫秒（秒是10位，毫秒是13位）
  const ms = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
  const date = new Date(ms);

  // 检查日期是否有效
  if (Number.isNaN(date.getTime())) return '-';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const replacements: Record<string, string> = {
    YYYY: String(year),
    MM: month,
    DD: day,
    HH: hours,
    mm: minutes,
    ss: seconds
  };

  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => replacements[match] || match);
};

/**
 * 格式化时间为相对时间（如：刚刚、几分钟前、几小时前等）
 * @param timestamp - 时间戳（秒或毫秒）
 * @returns 相对时间字符串
 */
export const formatRelativeTime = (timestamp: number | null | undefined): string => {
  if (!timestamp) return '-';

  const ms = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
  const now = Date.now();
  const diff = now - ms;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(diff / 2592000000);
  const years = Math.floor(diff / 31536000000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  if (months < 12) return `${months}个月前`;
  return `${years}年前`;
};

/**
 * 格式化时间为日期（YYYY-MM-DD）
 * @param timestamp - 时间戳（秒或毫秒）
 * @returns 日期字符串
 */
export const formatDate = (timestamp: number | null | undefined): string => {
  return formatTime(timestamp, 'YYYY-MM-DD');
};

/**
 * 格式化时间为时间（HH:mm:ss）
 * @param timestamp - 时间戳（秒或毫秒）
 * @returns 时间字符串
 */
export const formatTimeOnly = (timestamp: number | null | undefined): string => {
  return formatTime(timestamp, 'HH:mm:ss');
};

/**
 * 格式化时间为日期时间（YYYY-MM-DD HH:mm）
 * @param timestamp - 时间戳（秒或毫秒）
 * @returns 日期时间字符串
 */
export const formatDateTime = (timestamp: number | null | undefined): string => {
  return formatTime(timestamp, 'YYYY-MM-DD HH:mm');
};
