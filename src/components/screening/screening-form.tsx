"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { toast } from "sonner";
import { isSupportedDocumentExtension } from "@/lib/document-formats";
import type { JobDescriptionRecord } from "@/lib/job-description-queries";

const JD_ACCEPT =
  ".pdf,.doc,.docx,.txt,.md,.rtf,.odt,.html,.htm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

interface ScreeningFormProps {
  scoreThreshold?: string;
  onScoreThresholdChange?: (value: string) => void;
  savedJobDescriptions?: JobDescriptionRecord[];
}

export function ScreeningForm({
  scoreThreshold: scoreThresholdProp,
  onScoreThresholdChange,
  savedJobDescriptions = [],
}: ScreeningFormProps = {}) {
  const router = useRouter();
  const { status } = useSession();
  const [files, setFiles] = useState<File[]>([]);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdDragOver, setJdDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState("");
  const [jdText, setJdText] = useState("");
  const [selectedLibraryJdId, setSelectedLibraryJdId] = useState("");
  const [minExperience, setMinExperience] = useState("5");
  const [internalThreshold, setInternalThreshold] = useState("70");
  const scoreThreshold = scoreThresholdProp ?? internalThreshold;
  const setScoreThreshold = onScoreThresholdChange ?? setInternalThreshold;

  const acceptJdFile = useCallback((file: File) => {
    if (!isSupportedDocumentExtension(file.name)) {
      toast.error("Unsupported JD format. Use PDF, DOCX, DOC, TXT, MD, RTF, or ODT.");
      return;
    }
    setSelectedLibraryJdId("");
    setJdFile(file);
  }, []);

  function handleLibraryJdSelect(id: string) {
    setSelectedLibraryJdId(id);
    if (!id) return;
    const saved = savedJobDescriptions.find((jd) => jd.id === id);
    if (!saved) return;
    setJdText(saved.jdText);
    setTitle(saved.title);
    setJdFile(null);
  }

  function handleJdTextChange(value: string) {
    setSelectedLibraryJdId("");
    setJdText(value);
  }

  const handleJdDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setJdDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) acceptJdFile(dropped);
    },
    [acceptJdFile]
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith(".pdf") || f.name.endsWith(".docx")
    );
    setFiles((prev) => [...prev, ...dropped].slice(0, 200));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "unauthenticated") {
      toast.error("Please sign in to start screening");
      router.push("/login?callbackUrl=%2F");
      return;
    }
    if (files.length === 0) {
      toast.error("Add at least one resume");
      return;
    }

    const form = e.currentTarget;
    const trimmedJdText = jdText.trim();
    if (!trimmedJdText && !jdFile) {
      toast.error("Paste a job description, pick one from the library, or upload a JD document");
      return;
    }

    setLoading(true);
    const formData = new FormData(form);
    formData.set("title", title);
    formData.set("jdText", trimmedJdText);
    formData.set("minExperience", minExperience);
    formData.set("scoreThreshold", scoreThreshold);
    if (jdFile) formData.set("jdFile", jdFile);
    files.forEach((f) => formData.append("resumes", f));

    try {
      const { startScreeningAction } = await import("@/actions/job.actions");
      await startScreeningAction(formData);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      toast.error(err instanceof Error ? err.message : "Screening failed");
      setLoading(false);
    }
  }

  return (
    <form id="screening-form" className="form-card" onSubmit={handleSubmit}>
      <div className="form-title">Start a new screening</div>
      <p className="form-sub">
        Add the role, upload or paste the JD, then drop in resumes — we&apos;ll extract competencies
        and let you confirm skills before screening.
      </p>

      <div className="field">
        <label>
          Job Title <span className="req">*</span>
        </label>
        <input
          type="text"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Senior Frontend Engineer"
        />
      </div>

      <div className="field">
        <label>
          Job Description <span className="req">*</span>
        </label>
        {savedJobDescriptions.length > 0 && (
          <div className="radius-wrap" style={{ marginBottom: 10 }}>
            <select
              value={selectedLibraryJdId}
              onChange={(e) => handleLibraryJdSelect(e.target.value)}
              aria-label="Select a saved job description"
            >
              <option value="">Choose from saved job descriptions (optional)</option>
              {savedJobDescriptions.map((jd) => (
                <option key={jd.id} value={jd.id}>
                  {jd.title}
                  {jd.roleTag ? ` · ${jd.roleTag}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        <textarea
          name="jdText"
          value={jdText}
          onChange={(e) => handleJdTextChange(e.target.value)}
          placeholder="Paste the full job description — pick from the library above, or upload a document below."
          rows={4}
        />
        <div
          className="drop drop--jd"
          style={jdDragOver ? { borderColor: "var(--red)", background: "#FCF6F6" } : undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setJdDragOver(true);
          }}
          onDragLeave={() => setJdDragOver(false)}
          onDrop={handleJdDrop}
          onClick={() => document.getElementById("jd-input")?.click()}
        >
          <span className="big">📄</span>
          {jdFile ? (
            <>
              <b>{jdFile.name}</b>
              <br />
              <span className="drop-sub">Click to replace JD file</span>
            </>
          ) : (
            <>
              Upload <b>job description</b>
              <br />
              PDF · DOCX · DOC · TXT · MD · RTF · ODT
            </>
          )}
        </div>
        <input
          id="jd-input"
          type="file"
          accept={JD_ACCEPT}
          className="hidden"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) acceptJdFile(file);
          }}
        />
        {jdFile && (
          <div className="files">
            <span className="fchip">
              <i>📄</i> {jdFile.name}
            </span>
            <button
              type="button"
              className="fchip"
              style={{ cursor: "pointer", border: "none" }}
              onClick={() => setJdFile(null)}
            >
              Remove JD
            </button>
          </div>
        )}
      </div>

      <div className="field">
        <label>
          Mandatory candidate requirements
          <span className="hint">optional</span>
        </label>
        <textarea
          name="mandatoryRequirements"
          placeholder="e.g. Must have used Claude in production · 1+ year with LLM APIs · Only consider candidates who mention RAG experience..."
          rows={3}
        />
        <p className="form-hint">
          Free-text deal-breakers for this run. Claude will check every resume against these. Leave
          blank to screen using the JD only.
        </p>
      </div>

      <div className="field">
        <label>
          Candidate Resumes <span className="req">*</span>
        </label>
        <div
          className="drop"
          style={dragOver ? { borderColor: "var(--red)", background: "#FCF6F6" } : undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("resume-input")?.click()}
        >
          <span className="big">↑</span>
          Drag &amp; drop <b>resumes</b>
          <br />
          PDF / DOCX — up to 200 files
        </div>
        <input
          id="resume-input"
          type="file"
          multiple
          accept=".pdf,.docx"
          className="hidden"
          style={{ display: "none" }}
          onChange={(e) => {
            const selected = Array.from(e.target.files || []);
            setFiles((prev) => [...prev, ...selected].slice(0, 200));
          }}
        />
        {files.length > 0 && (
          <div className="files">
            {files.slice(0, 4).map((f) => (
              <span key={f.name} className="fchip">
                <i>📄</i> {f.name}
              </span>
            ))}
            {files.length > 4 && <span className="fchip">+{files.length - 4} more</span>}
            <button
              type="button"
              className="fchip"
              style={{ cursor: "pointer", border: "none" }}
              onClick={() => setFiles([])}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <input type="hidden" name="minExperience" value={minExperience} />
      <input type="hidden" name="scoreThreshold" value={scoreThreshold} />

      <div className="row2">
        <div className="field">
          <label>Min. experience</label>
          <div className="radius-wrap">
            <select
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value)}
              aria-label="Minimum experience"
            >
              <option value="0">Fresher</option>
              <option value="1">1+ years</option>
              <option value="3">3+ years</option>
              <option value="5">5+ years</option>
              <option value="8">8+ years</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Shortlist threshold</label>
          <div className="radius-wrap">
            <select
              value={scoreThreshold}
              onChange={(e) => setScoreThreshold(e.target.value)}
              aria-label="Shortlist threshold"
            >
              <option value="60">Score ≥ 60</option>
              <option value="70">Score ≥ 70</option>
              <option value="80">Score ≥ 80</option>
            </select>
          </div>
        </div>
      </div>

      <button type="submit" className="btn-submit" disabled={loading || files.length === 0}>
        {loading ? "Analyzing JD…" : "Extract skills & continue →"}
      </button>
      <p className="form-note" style={{ marginTop: 8, fontSize: 12, color: "var(--mute)" }}>
        Next step: review must-have &amp; good-to-have skills before resumes are screened.
      </p>
      <p className="form-note">
        <span className="check">✓</span> Secure &amp; private
        <span className="check"> · ✓</span> Audit-ready
        <span className="check"> · ✓</span> Under 90 seconds
      </p>
    </form>
  );
}
