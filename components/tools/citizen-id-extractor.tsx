"use client";

import { useEffect, useRef, useState } from "react";
import { combineOcr, emptySlot, fields, labels, loadSlots, nameSuggestions, parseColorPass, parseText, saveSlots, type Field, type Slot } from "@/lib/citizen-id/data";
import { prepareImage } from "@/lib/citizen-id/image";

function ImageInput({ image, label, disabled, onChange }: { image: Blob | null; label: string; disabled: boolean; onChange: (file: File | null) => void }) {
  const [url, setUrl] = useState("");
  useEffect(() => { if (!image) return; const reader = new FileReader(); reader.onload = () => setUrl(String(reader.result)); reader.readAsDataURL(image); return () => reader.abort(); }, [image]);
  return <div className="rounded-lg border border-dashed p-4" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!disabled && e.dataTransfer.files[0]) onChange(e.dataTransfer.files[0]); }}>
    <label className="block font-medium">{label}<input className="mt-2 block w-full text-sm" type="file" accept="image/*" disabled={disabled} onChange={e => { const file = e.target.files?.[0]; if (file) onChange(file); e.target.value = ""; }} /></label>
    <p className="mt-1 text-xs text-muted-foreground">Choose or drop an image here. Choose another to replace it.</p>
    {image && <div className="mt-3">{url && <img src={url} alt={`${label} preview`} className="max-h-48 max-w-full rounded object-contain" />}<button type="button" disabled={disabled} className="mt-2 underline" onClick={() => onChange(null)}>Remove {label.toLowerCase()}</button></div>}
  </div>;
}

export function CitizenIdExtractor() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const queue = useRef<Promise<void>>(Promise.resolve());
  const slotsRef = useRef<Slot[]>([]);
  const busyRef = useRef(false);
  useEffect(() => { let active = true; loadSlots().then(saved => { if (active) { const restored = saved?.length ? saved : [emptySlot()]; slotsRef.current = restored; setSlots(restored); setReady(true); } }).catch(() => { if (active) { setError("Could not restore local storage. Changes may not persist."); const initial = [emptySlot()]; slotsRef.current = initial; setSlots(initial); setReady(true); } }); return () => { active = false; }; }, []);
  function persist(next: Slot[] | null) { const operation = queue.current.catch(() => {}).then(() => saveSlots(next)); queue.current = operation; return operation; }
  function update(next: Slot[]) { slotsRef.current = next; setSlots(next); void persist(next).catch(() => setError("Could not save to local storage. Check browser storage availability.")); }
  function changeImage(id: string, side: "front" | "back", file: File | null) { if (file && !file.type.startsWith("image/")) { setError("Please choose an image file."); return; } setError(""); update(slotsRef.current.map(slot => slot.id === id ? { ...slot, [side]: file, uncertain: [...fields], nameSuggestions: [] } : slot)); }
  function edit(id: string, field: Field, value: string) { update(slotsRef.current.map(slot => slot.id === id ? { ...slot, values: { ...slot.values, [field]: value }, nameSuggestions: field === "name" ? [] : slot.nameSuggestions, uncertain: value.trim() ? slot.uncertain.filter(f => f !== field) : [...new Set([...slot.uncertain, field])] } : slot)); }
  async function extract() {
    if (busyRef.current) return;
    if (!slots.some(s => s.front || s.back)) { setError("Add at least one image before extracting."); return; }
    busyRef.current = true; setError(""); setBusy(true); setStatus("Loading local OCR and reading images…");
    let worker: Awaited<ReturnType<typeof import("tesseract.js").createWorker>> | undefined;
    try {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("vie+eng", 1, { workerPath: "/ocr/worker.min.js", corePath: "/ocr", langPath: "/ocr", cacheMethod: "none" });
      await worker.setParameters({ tessedit_pageseg_mode: "3" as import("tesseract.js").PSM });
      const primary: Partial<Slot["values"]>[] = [];
      const primaryFronts: string[] = [];
      for (const slot of slots) {
        const front = slot.front ? (await worker.recognize(await prepareImage(slot.front))).data.text : "";
        const back = slot.back ? (await worker.recognize(await prepareImage(slot.back))).data.text : "";
        const texts = [front, back];
        primaryFronts.push(front);
        primary.push(parseText(texts.join("\n")));
      }
      await worker.reinitialize("vie");
      const next: Slot[] = [];
      for (let index = 0; index < slots.length; index++) {
        const slot = slots[index];
        const front = slot.front ? (await worker.recognize(await prepareImage(slot.front, false))).data.text : "";
        const back = slot.back ? (await worker.recognize(await prepareImage(slot.back, false))).data.text : "";
        const color = parseColorPass(front, back);
        const found = combineOcr(primary[index], color, primaryFronts[index], front);
        const values = { ...slot.values };
        for (const field of fields) if (slot.uncertain.includes(field) || !values[field]) values[field] = found[field] ?? "";
        next.push({ ...slot, values, nameSuggestions: slot.uncertain.includes("name") || !slot.values.name ? nameSuggestions(primary[index].name, color.name) : [], uncertain: [...new Set([...slot.uncertain, ...Object.keys(found) as Field[]])] });
      }
      update(next); setStatus("Extraction finished. Review highlighted fields; OCR can be inaccurate.");
    } catch { setError("Extraction failed. Check that local OCR files are available and try again."); setStatus(""); }
    finally { try { if (worker) await worker.terminate(); } finally { busyRef.current = false; setBusy(false); } }
  }
  async function reset() { if (busyRef.current || !window.confirm("Clear all employees, images and saved data from this browser?")) return; busyRef.current = true; setBusy(true); setError(""); setStatus("Clearing saved data…"); try { await persist(null); const initial = [emptySlot()]; slotsRef.current = initial; setSlots(initial); setStatus("Saved data cleared."); } catch { setError("Could not clear local storage. Your data remains available; try reset again."); setStatus(""); } finally { busyRef.current = false; setBusy(false); } }
  if (!ready) return <p role="status">Restoring saved employees…</p>;
  return <section className="space-y-6">
    <p className="text-sm text-muted-foreground">Images and data stay in this browser. OCR is approximate; review every extracted value. Data remains on this device until reset.</p>
    {error && <p role="alert" className="rounded border border-destructive p-3 text-destructive">{error}</p>}{status && <p role="status">{status}</p>}
    {slots.map((slot, index) => <fieldset key={slot.id} disabled={busy} className="space-y-4 rounded-xl border p-4"><legend className="px-2 font-semibold">Employee {index + 1}</legend><div className="grid gap-4 sm:grid-cols-2"><ImageInput label={`Employee ${index + 1} front side`} image={slot.front} disabled={busy} onChange={file => changeImage(slot.id, "front", file)} /><ImageInput label={`Employee ${index + 1} back side`} image={slot.back} disabled={busy} onChange={file => changeImage(slot.id, "back", file)} /></div><button type="button" className="underline disabled:opacity-50" disabled={slots.length === 1 || busy} onClick={() => update(slotsRef.current.filter(s => s.id !== slot.id))}>Remove employee {index + 1}</button></fieldset>)}
    <div className="flex flex-wrap gap-3"><button className="rounded border px-4 py-2" disabled={busy} onClick={() => update([...slotsRef.current, emptySlot()])}>Add employee</button><button className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50" disabled={busy} onClick={extract}>{busy ? "Extracting…" : "Extract data"}</button><button className="rounded border px-4 py-2" disabled={busy} onClick={reset}>Reset</button></div>
    <div><h2 className="mb-2 text-xl font-semibold">Review and edit</h2><p className="mb-3 text-sm text-muted-foreground">Highlighted cells are missing or require review. Editing a value marks it reviewed.</p><div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left text-sm"><thead><tr><th className="p-2">Employee</th>{fields.map(f => <th className="p-2" key={f}>{labels[f]}</th>)}</tr></thead><tbody>{slots.map((slot, index) => <tr key={slot.id} className="border-t"><th className="p-2">{index + 1}</th>{fields.map(f => { const needsReview = !slot.values[f].trim() || slot.uncertain.includes(f); return <td className="p-1" key={f}><input aria-label={`${labels[f]}, employee ${index + 1}${needsReview ? ", needs review" : ""}`} className={`w-full min-w-32 rounded border p-2 ${needsReview ? "border-amber-600 bg-amber-100 text-black" : "bg-background"}`} value={slot.values[f]} disabled={busy} onChange={e => edit(slot.id, f, e.target.value)} /></td>; })}</tr>)}</tbody></table></div>{slots.map((slot, index) => slot.nameSuggestions?.length ? <div key={slot.id} role="group" aria-label={`Name suggestions for employee ${index + 1}`} className="mt-4 rounded border p-3"><p className="mb-2 text-sm">Employee {index + 1}: OCR passes differ on accents. Choose a name after checking the card, or edit the table.</p><div className="flex flex-wrap gap-2">{slot.nameSuggestions.map(name => <button type="button" className="rounded border px-3 py-2 text-left" key={name} disabled={busy} onClick={() => edit(slot.id, "name", name)}>{name}</button>)}</div></div> : null)}</div>
  </section>;
}
