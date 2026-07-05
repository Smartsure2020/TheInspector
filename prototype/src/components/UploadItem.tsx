"use client";
// Real per-item uploader (Chunk 1C): camera/gallery/file via <input type=file>,
// posts to uploadEvidenceAction, shows per-item complete state.
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadEvidenceAction } from "@/lib/actions";

export function UploadItem({ token, itemKey, label, done }: { token: string; itemKey: string; label: string; done: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const [justDone, setJustDone] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const complete = done || justDone;

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setErr("");
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      try {
        await uploadEvidenceAction(token, itemKey, fd);
        setJustDone(true);
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Upload failed — please try again.");
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="text-sm font-medium text-slate-800">{label}</div>
      {complete ? (
        <div className="mt-2 text-emerald-700 text-sm font-medium">✓ Received — thank you</div>
      ) : (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <button
            disabled={pending}
            className="mt-2 w-full bg-blue-600 disabled:bg-slate-300 text-white rounded-xl py-3 text-sm font-semibold"
            onClick={() => fileRef.current?.click()}
          >
            {pending ? "Uploading…" : "📷 Take photo or choose file"}
          </button>
          {err && <p className="text-xs text-rose-600 mt-2">{err}</p>}
        </>
      )}
    </div>
  );
}
