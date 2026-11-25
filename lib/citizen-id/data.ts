export const fields = ["name", "number", "birth", "sex", "residence", "issue", "authority"] as const;
export type Field = typeof fields[number];
export const labels: Record<Field, string> = {name: "Full name", number: "Citizen ID number (CCCD)", birth: "Date of birth", sex: "Sex", residence: "Place of residence", issue: "Date of issue", authority: "Issuing authority"};
export type Values = Record<Field, string>;
export type Slot = { id: string; front: Blob | null; back: Blob | null; values: Values; uncertain: Field[]; nameSuggestions?: string[] };
export const emptySlot = (): Slot => ({id: crypto.randomUUID(), front: null, back: null, values: {name:"", number:"", birth:"", sex:"", residence:"", issue:"", authority:""}, uncertain: [...fields]});

// Values derived from OCR are always reviewed by the user; conflicting candidates are omitted.
export function parseText(text: string): Partial<Values> {
  type Key = Field | "origin" | "other";
  const labelPatterns: [Key, RegExp][] = [
    ["name", /^(?:họ\s*và\s*tên|full\s*name)(?=\s|[:：/]|$)/i],
    ["birth", /^(?:ngày\s*sinh|date\s*of\s*birth)(?=\s|[:：/]|$)/i],
    ["sex", /^(?:giới\s*tính|sex)(?=\s|[:：/]|$)/i],
    ["residence", /^(?:nơi\s*thường\s*trú|place\s*of\s*residence)(?=\s|[:：/]|$)/i],
    ["origin", /^(?:quê\s*quán|place\s*of\s*origin)(?=\s|[:：/]|$)/i],
    ["issue", /^(?:ngày\s*cấp|date\s*of\s*issue)(?=\s|[:：/]|$)/i],
    ["authority", /^(?:nơi\s*cấp|cơ\s*quan\s*cấp|issuing\s*authority)(?=\s|[:：/]|$)/i],
    ["number", /^(?:số(?:\s*định\s*danh)?|no\.?|cccd)(?=\s|[:：/]|$)/i],
    ["other", /^(?:quốc\s*tịch|nationality|có\s*giá\s*trị|date\s*of\s*expiry|đặc\s*điểm\s*nhận\s*dạng|personal\s*identification|vân\s*tay|fingerprint|ngày\s*hết\s*hạn|giá\s*trị\s*đến)(?=\s|[:：/]|$)/i],
  ];
  const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  const foldedPatterns = labelPatterns.map(([key, pattern]) => [key, new RegExp(fold(pattern.source), "i")] as [Key, RegExp]);
  const candidates: Partial<Record<Field, string[]>> = {};
  let active: Key | null = null;
  let pending = "";
  let continuationCount = 0;
  const add = (field: Field, value: string) => {
    value = value.trim().replace(/^[\s:：/|,-]+/, "").trim();
    if (!value || /^(?:place|full|name|date|of)$/i.test(value)) return;
    if (field === "name" && (!/^[\p{L} .\x27-]+$/u.test(value) || value.split(/\s+/).length < 2 || value.length > 80)) return;
    if (field === "residence" && (value.length > 200 || continuationCount > 3)) return;
    if (field === "number") { const match = value.match(/(?:^|\D)(\d{12})(?!\d)/); if (!match) return; value = match[1]; }
    if (field === "sex") { const match = value.match(/^(nam|nữ|male|female)(?:\b|$)/i); if (!match) return; value = match[1]; }
    if (field === "birth" || field === "issue") {
      const match = value.match(/(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4})/) ?? value.match(/ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i);
      if (!match) return;
      const day = Number(match[1]), month = Number(match[2]), year = Number(match[3]);
      const date = new Date(Date.UTC(year, month - 1, day));
      if (year < 1900 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return;
      value = `${match[1].padStart(2, "0")}/${match[2].padStart(2, "0")}/${match[3]}`;
    }
    (candidates[field] ??= []).push(value);
  };
  const flush = () => { if (active && active !== "origin" && active !== "other") add(active, pending); pending = ""; continuationCount = 0; };
  const lines = text.normalize("NFC").split(/\r?\n/).map(line => {
    line = line.trim();
    const colon = line.search(/[:：]/);
    if (colon < 0) return line;
    const label = fold(line.slice(0, colon)).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    // A single stray OCR glyph after the label is not a sex value; allow the next line to be read.
    if (/^(gioi\s*tinh|sex)$/.test(label) && value.length === 1 && /[^\x00-\x7f]/.test(value)) return line.slice(0, colon + 1);
    return line;
  }).filter(Boolean);
  for (const line of lines) {
    // The issuing officer block is not a residence continuation or an inferred name.
    const foldedLine = fold(line);
    if (/^(?:cuc\s*truong\s*)?cuc\s*canh\s*sat\s*(?:quan\s*ly|dkql)/i.test(foldedLine) || /^bo\s*cong\s*an$/i.test(foldedLine)) {
      flush(); active = "authority"; pending = line; continue;
    }
    if (/^ngày\s*\d{1,2}\s*tháng\s*\d{1,2}\s*năm\s*\d{4}/i.test(line)) { flush(); active = "issue"; pending = line; continue; }
    const label = foldedPatterns.find(([key, pattern]) => pattern.test(foldedLine) && !(key === "number" && active === "residence" && !/\d{12}/.test(line)));
    if (label) {
      const [field, pattern] = label;
      // Bilingual label-only lines (e.g. Họ và tên / Full name) describe the same field.
      const rest = line.slice(foldedLine.match(pattern)![0].length).replace(/^[\s:：/|,-]+/, "");
      const translated = foldedPatterns.find(([key, p]) => key === field && p.test(fold(rest)));
      let value = translated ? rest.slice(fold(rest).match(translated[1])![0].length).replace(/^[\s:：/|,-]+/, "") : rest;
      if (/^(?:place|full|date|of)$/i.test(value)) value = "";
      if (active === field && !pending && !value) continue;
      flush(); active = field; pending = value; continue;
    }
    if (active === "residence" || active === "authority") {
      // Stop on common unrelated headings rather than treating them as an address.
      if (/^(?:căn\s*cước|cộng\s*hòa|socialist|signature|chữ\s*ký|[0-9]{1,2}\s*tháng)/i.test(line)) { flush(); active = null; }
      else { pending = [pending, line].filter(Boolean).join(", "); continuationCount++; }
    } else if (active && active !== "other" && active !== "origin" && !pending) { if (active !== "name" || (/^[\p{L} .\x27-]+$/u.test(line) && line.trim().split(/\s+/).length >= 2)) pending = line; }
    else if (!active && /^\d{12}$/.test(line)) add("number", line);
  }
  flush();
  const result: Partial<Values> = {};
  for (const field of fields) {
    const unique = [...new Set(candidates[field] ?? [])];
    if (unique.length === 1) result[field] = unique[0];
  }
  return result;
}

// A second color OCR pass can recover accents and the date printed on a card's back.
export function parseColorPass(front: string, back: string): Partial<Values> {
  const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();
  const lines = front.normalize("NFC").split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const names: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/(?:ho\s+va\s+ten|full\s+name)/i.test(fold(lines[i]))) continue;
    for (const line of lines.slice(i + 1, i + 4)) {
      if (/(?:ngay\s+sinh|date\s+of\s+birth|gioi\s+tinh)/i.test(fold(line))) break;
      const found = line.match(/(?:[\p{Lu}]{2,}\s+){1,}[\p{Lu}]{2,}/gu) ?? [];
      names.push(...found.map(x => x.trim()));
    }
  }
  const result: Partial<Values> = {};
  const parsedFront = parseText(front);
  if (parsedFront.number) result.number = parsedFront.number;
  const uniqueNames = [...new Set(names)];
  if (uniqueNames.length === 1) result.name = uniqueNames[0];
  const backLines = back.normalize("NFC").split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const dates: string[] = [];
  for (let i = 0; i < backLines.length; i++) {
    const heading = fold(backLines[i]);
    if (!/date.{0,12}month.{0,12}year/i.test(heading) || /expiry|expiration|het\s+han/i.test(heading)) continue;
    for (const line of backLines.slice(i, i + 2)) {
      if (/expiry|expiration|het\s+han/i.test(fold(line))) continue;
      for (const match of line.matchAll(/\d{1,2}\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{4}/g)) {
        const parsed = parseText(`Ngày cấp: ${match[0]}`).issue;
        if (parsed) dates.push(parsed);
      }
    }
  }
  const uniqueDates = [...new Set(dates)];
  if (uniqueDates.length === 1) result.issue = uniqueDates[0];
  return result;
}

// Offer conflicting diacritics for review only when both passes agree on the letters.
export function nameSuggestions(primary?: string, alternate?: string): string[] {
  if (!primary || !alternate) return [];
  const names = [primary.normalize("NFC"), alternate.normalize("NFC")];
  const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();
  return names[0] !== names[1] && fold(names[0]) === fold(names[1]) ? names : [];
}

export function combineOcr(primary: Partial<Values>, color: Partial<Values>, primaryFront = "", colorFront = ""): Partial<Values> {
  const result = { ...primary };
  const numbers = (text: string) => [...new Set([...text.matchAll(/(?:^|\D)(\d{12})(?!\d)/g)].map(match => match[1]))];
  const primaryNumbers = numbers(primaryFront), colorNumbers = numbers(colorFront);
  if (primaryNumbers.length > 1 || colorNumbers.length > 1 || (primary.number && colorNumbers.length === 1 && primary.number !== colorNumbers[0]) || (primary.number && color.number && primary.number !== color.number)) delete result.number;
  else if (!primary.number && color.number && primaryNumbers.length === 1 && primaryNumbers[0] === color.number && colorNumbers.length === 1 && colorNumbers[0] === color.number) result.number = color.number;
  if (!result.issue && color.issue) result.issue = color.issue;
  // Conflicting OCR readings stay available for review; extra marks do not prove correctness.
  if (!result.name && color.name) result.name = color.name;
  return result;
}

const DB = "citizen-id-extractor";
function openDB(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const request = indexedDB.open(DB, 1); request.onupgradeneeded = () => request.result.createObjectStore("state"); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
export async function loadSlots(): Promise<Slot[] | undefined> { const db = await openDB(); try { return await new Promise((resolve, reject) => { const tx = db.transaction("state", "readonly"); const req = tx.objectStore("state").get("slots"); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); } finally { db.close(); } }
export async function saveSlots(slots: Slot[] | null): Promise<void> { const db = await openDB(); try { await new Promise<void>((resolve, reject) => { const tx = db.transaction("state", "readwrite"); if (slots) tx.objectStore("state").put(slots, "slots"); else tx.objectStore("state").delete("slots"); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); }); } finally { db.close(); } }
