import { $t } from '@/locales';

/**
 * Transform record to option
 *
 * @example
 *   ```ts
 *   const record = {
 *     key1: 'label1',
 *     key2: 'label2'
 *   };
 *   const options = transformRecordToOption(record);
 *   // [
 *   //   { value: 'key1', label: 'label1' },
 *   //   { value: 'key2', label: 'label2' }
 *   // ]
 *   ```;
 *
 * @param record
 */
export function transformRecordToOption<T extends Record<string, string>>(record: T) {
  return Object.entries(record).map(([value, label]) => ({
    value,
    label
  })) as CommonType.Option<keyof T, T[keyof T]>[];
}

/**
 * Translate options
 *
 * @param options
 */
export function translateOptions(options: CommonType.Option<string, App.I18n.I18nKey>[]) {
  return options.map(option => ({
    ...option,
    label: $t(option.label)
  }));
}

/**
 * Toggle html class
 *
 * @param className
 */
export function toggleHtmlClass(className: string) {
  function add() {
    document.documentElement.classList.add(className);
  }

  function remove() {
    document.documentElement.classList.remove(className);
  }

  return {
    add,
    remove
  };
}

/**
 * 日期工具类 - 维保日历专用
 * @author 你的名字
 * @date 2026-01-23
 */

/**
 * 获取当前日期的字符串格式（YYYY-MM-DD）
 * @returns 格式化后的日期字符串
 */
export const getCurrentDateStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 获取指定年月的第一天和最后一天
 * @param date 目标日期对象
 * @returns 包含start和end的日期范围对象（YYYY-MM-DD格式）
 */
export const getMonthRange = (date: Date): { start: string; end: string } => {
  const year = date.getFullYear();
  const month = date.getMonth();

  // 当月第一天
  const firstDay = new Date(year, month, 1);
  // 下月第一天的前一天 = 当月最后一天
  const lastDay = new Date(year, month + 1, 0);

  const formatDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dStr}`;
  };

  return {
    start: formatDate(firstDay),
    end: formatDate(lastDay)
  };
};

/**
 * 格式化日期对象为字符串（YYYY-MM-DD）
 * @param date 日期对象
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * 计算指定年月的天数
 * @param m 月份（0-11）
 * @param y 年份
 * @returns 该月的天数
 */
export const daysInMonth = (m: number, y: number): number => {
  return new Date(y, m + 1, 0).getDate();
};
