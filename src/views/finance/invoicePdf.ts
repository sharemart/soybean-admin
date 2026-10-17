export interface PdfTextPiece {
  text: string;
  x: number;
  y: number;
  width?: number;
}

export interface ParsedInvoice {
  title?: string;
  taxNo?: string;
  invoiceNo?: string;
  /** 传统发票的发票代码。数电发票没有这一项 */
  invoiceCode?: string;
  amount?: string;
  invoiceDate?: string;
}

interface TextLine {
  y: number;
  text: string;
}

const PARTY_NAME = /名称[:：]\s*([^\n]{2,80}?)(?=\s*(?:统一社会信用代码|纳税人识别号|地址[:：]|电话[:：]|名称[:：]|$))/;

const TAX_LABEL = /(?:统一社会信用代码\/纳税人识别号|纳税人识别号|统一社会信用代码)[:：]?([0-9A-Z]{15,20})/;

export function parseInvoicePieces(pieces: PdfTextPiece[]): ParsedInvoice | null {
  const items = pieces
    .map(item => ({
      ...item,
      text: String(item.text || '')
        .replace(/\u0000/g, '')
        .trim()
    }))
    .filter(item => item.text);
  if (!items.length) return null;

  const full = joinLines(groupLines(items));
  const xs = items.map(item => item.x);
  const spread = Math.max(...xs) - Math.min(...xs);
  const maxX = Math.max(...items.map(item => item.x + (item.width || estimateWidth(item.text))));
  const splitX = maxX * 0.46;
  const left = spread > 180 ? joinLines(groupLines(items.filter(item => item.x < splitX))) : '';
  const buyerText = pickBuyerText(full, left);

  const invoiceNo = readInvoiceNo(full);
  const invoiceCode = readInvoiceCode(full);
  let party = readParty(buyerText, invoiceNo);
  if (party.title && !party.taxNo) {
    const between = sliceBetween(full, /购买方|购\s*买\s*方/, /销售方|销\s*售\s*方/);
    const fallback = readParty(between || full, invoiceNo);
    if (fallback.taxNo) party = { ...party, taxNo: fallback.taxNo };
  }
  const parsed: ParsedInvoice = {
    title: party.title,
    taxNo: party.taxNo,
    invoiceNo,
    invoiceCode,
    amount: readAmount(full),
    invoiceDate: readDate(full)
  };

  if (!parsed.title && !parsed.taxNo && !parsed.invoiceNo && !parsed.amount && !parsed.invoiceDate) return null;
  return parsed;
}

function groupLines(items: PdfTextPiece[]): TextLine[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const groups: { y: number; parts: PdfTextPiece[] }[] = [];

  sorted.forEach(item => {
    const group = groups.find(entry => Math.abs(entry.y - item.y) <= 2.5);
    if (group) group.parts.push(item);
    else groups.push({ y: item.y, parts: [item] });
  });

  return groups.map(group => {
    const parts = group.parts.sort((a, b) => a.x - b.x);
    let text = '';
    let cursor = parts[0].x;
    parts.forEach(part => {
      if (text && part.x - cursor > 8) text += ' ';
      text += part.text;
      cursor = Math.max(cursor, part.x + (part.width || estimateWidth(part.text)));
    });
    return { y: group.y, text: text.replace(/\s+/g, ' ').trim() };
  });
}

function joinLines(lines: TextLine[]) {
  return lines.map(line => line.text).join('\n');
}

function estimateWidth(text: string) {
  return Math.max(text.length, 1) * 6;
}

function pickBuyerText(full: string, left: string) {
  if (left && /名称[:：]/.test(left) && !/销售方|销\s*售\s*方/.test(left)) return left;

  const between = sliceBetween(full, /购买方|购\s*买\s*方/, /销售方|销\s*售\s*方/);
  if (/名称[:：]/.test(between)) return between;

  const beforeSeller = full.split(/销售方|销\s*售\s*方/)[0] || '';
  if (/名称[:：]/.test(beforeSeller)) return beforeSeller;
  return left || full;
}

function sliceBetween(text: string, start: RegExp, end: RegExp) {
  const startMatch = start.exec(text);
  if (!startMatch || startMatch.index === undefined) return '';
  const from = text.slice(startMatch.index + startMatch[0].length);
  const endMatch = end.exec(from);
  return endMatch ? from.slice(0, endMatch.index) : from;
}

function readName(text: string) {
  const lines = text.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/名称[:：]/.test(line)) continue;
    const inline = line.match(PARTY_NAME);
    const inlineTitle = inline ? tidyName(inline[1]) : '';
    if (inlineTitle && !/购买方|销售方|价税合计|项目名称/.test(inlineTitle)) return inlineTitle;

    const next = lines[index + 1]?.trim() || '';
    if (!next || /名称[:：]|纳税人|统一社会信用|地址|电话|购买方|销售方/.test(next)) continue;
    const title = tidyName(next);
    if (title.length >= 2 && !/价税合计|项目名称/.test(title)) return title;
  }
  return '';
}

function readParty(text: string, invoiceNo?: string) {
  const title = readName(text);

  const flat = text.replace(/\s+/g, '').toUpperCase();
  const labeled = flat.match(TAX_LABEL)?.[1];
  const taxNo = labeled && labeled !== invoiceNo ? labeled : '';
  return { title: title || undefined, taxNo: taxNo || undefined };
}

function tidyName(raw: string) {
  let name = raw.replace(/\s+/g, ' ').trim();
  let previous = '';
  while (name !== previous) {
    previous = name;
    name = name.replace(/([\u4E00-\u9FFF])\s+(?=[\u4E00-\u9FFF（）()])/g, '$1');
  }
  return name.replace(/[¥￥].*$/, '').trim();
}

function readInvoiceNo(text: string) {
  const flat = text.replace(/\s+/g, '');
  return flat.match(/发票号码[:：]?(\d{20})/)?.[1] || flat.match(/发票号码[:：]?(\d{8})/)?.[1];
}

function readInvoiceCode(text: string) {
  const flat = text.replace(/\s+/g, '');
  if (/发票号码[:：]?\d{20}/.test(flat)) return undefined;
  return flat.match(/发票代码[:：]?(\d{10,12})/)?.[1];
}

function readDate(text: string) {
  const flat = text.replace(/\s+/g, '');
  const matched =
    flat.match(/开票日期[:：]?(\d{4})年(\d{1,2})月(\d{1,2})日/) || flat.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!matched) return undefined;
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  if (year < 2000 || month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function readAmount(text: string) {
  const flat = text.replace(/[ \t\n\r]/g, '');
  const patterns = [
    /价税合计[\s\S]{0,80}?[（(]小写[）)][¥￥]?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/,
    /[（(]小写[）)][¥￥](\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/,
    /价税合计[\s\S]{0,40}?[¥￥](\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/
  ];
  for (const pattern of patterns) {
    const matched = flat.match(pattern);
    if (!matched) continue;
    const value = Number(matched[1].replace(/,/g, ''));
    if (Number.isFinite(value) && value >= 0) return value.toFixed(2);
  }
  return undefined;
}
