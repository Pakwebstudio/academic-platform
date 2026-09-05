"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";

export default function PublishPaperPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    keywords: "",
    researchField: "",
    publicationType: "",
    journal: "",
    conference: "",
    publisher: "",
    publicationDate: "",
    doi: "",
    volume: "",
    issue: "",
    pages: "",
    externalUrl: "",
    price: "",
    accessType: "FREE",
    licenseType: "",
  });
  const [fileAssetId, setFileAssetId] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [fileUploading, setFileUploading] = useState(false);
  const [fileError, setFileError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes("pdf")) {
      setFileError("Only PDF files are supported.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setFileError("File is too large. Maximum size is 20MB.");
      return;
    }
    setFileError("");
    setSelectedFileName(file.name);
    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setFileAssetId("");
        setFileError(data.error || "Upload failed");
        return;
      }
      setFileAssetId(data.data.fileAssetId);
    } catch {
      setFileError("Something went wrong during upload");
    } finally {
      setFileUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.accessType === "PAID" && !fileAssetId) {
      setError("A PDF file is required for paid papers.");
      return;
    }
    setLoading(true);
    try {
      const keywords = form.keywords
        ? form.keywords.split(",").map((k) => k.trim()).filter(Boolean)
        : [];
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, keywords, fileAssetId: fileAssetId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to publish");
        return;
      }
      router.push("/dashboard/papers");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Publish Research Paper</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Paper Details</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-primary"
                placeholder="Full paper title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Abstract *</label>
              <textarea
                required
                value={form.abstract}
                onChange={(e) => setForm({ ...form, abstract: e.target.value })}
                className="flex min-h-[150px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-primary"
                placeholder="Paper abstract..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Keywords</label>
                <input
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-primary"
                  placeholder="Comma-separated keywords"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Research Field</label>
                <input
                  value={form.researchField}
                  onChange={(e) => setForm({ ...form, researchField: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-primary"
                  placeholder="e.g. Computer Science"
                />
              </div>
            </div>
          </div>

          {/* Publication Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Publication Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Publication Type</label>
                <select
                  value={form.publicationType}
                  onChange={(e) => setForm({ ...form, publicationType: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-primary"
                >
                  <option value="">Select type</option>
                  <option value="JOURNAL">Journal Article</option>
                  <option value="CONFERENCE">Conference Paper</option>
                  <option value="BOOK_CHAPTER">Book Chapter</option>
                  <option value="PREPRINT">Preprint</option>
                  <option value="THESIS">Thesis</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Publication Date</label>
                <input
                  type="date"
                  value={form.publicationDate}
                  onChange={(e) => setForm({ ...form, publicationDate: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-primary"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Journal</label>
                <input value={form.journal} onChange={(e) => setForm({ ...form, journal: e.target.value })} className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Conference</label>
                <input value={form.conference} onChange={(e) => setForm({ ...form, conference: e.target.value })} className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-primary" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">DOI</label>
                <input value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-primary" placeholder="10.xxxx/xxxxx" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Volume</label>
                <input value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pages</label>
                <input value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-primary" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">External Publication URL</label>
              <input type="url" value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-primary" placeholder="https://..." />
            </div>
          </div>

          {/* Paper File */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Paper File</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">PDF File {form.accessType === "PAID" ? "*" : ""}</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-indigo-100"
              />
              {fileUploading && <p className="mt-2 text-sm text-slate-500">Uploading...</p>}
              {selectedFileName && !fileError && !fileUploading && (
                <p className="mt-2 text-sm text-emerald-600">Uploaded: {selectedFileName}</p>
              )}
              {fileError && <p className="mt-2 text-sm text-rose-600">{fileError}</p>}
              <p className="mt-2 text-xs text-slate-400">
                PDF only, up to 20MB. Files are stored privately and only accessible to readers with authorized access.
              </p>
            </div>
          </div>

          {/* Access & Pricing */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Access & Pricing</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Access Type</label>
                <select
                  value={form.accessType}
                  onChange={(e) => setForm({ ...form, accessType: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-primary"
                >
                  <option value="FREE">Free</option>
                  <option value="PAID">Paid</option>
                  <option value="EXTERNAL_LINK">External Link</option>
                </select>
              </div>
              {form.accessType === "PAID" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Price (PKR)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-primary"
                    placeholder="1500"
                  />
                </div>
              )}
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              {form.accessType === "PAID"
                ? "Note: Paid papers require a PDF upload. Papers with multiple authors require permission from all authors before they can be sold."
                : form.accessType === "FREE"
                ? "This paper will be available for free access after admin approval (PDF upload recommended)."
                : "Users will be redirected to the external publication link."}
            </div>
          </div>

          {error && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={loading}>Submit for Review</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
