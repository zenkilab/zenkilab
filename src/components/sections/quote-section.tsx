"use client";

import { ScrollFade } from "@/components/ui/scroll-fade";
import { useState, useCallback, useRef, useEffect, useId, isValidElement, cloneElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Upload,
  X,
  File as FileIcon,
  CheckCircle,
  Loader2,
  Paperclip,
  Sparkles,
} from "lucide-react";

const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250 MB
const ACCEPTED_TYPES = [
  ".stl",
  ".obj",
  ".3mf",
  ".step",
  ".stp",
  ".zip",
];

const quoteSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  country: z.string().min(1, "Country is required"),
  material: z.string().min(1, "Please select a material"),
  color: z.string().min(1, "Color preference is required"),
  quantity: z.string().min(1, "Quantity is required"),
  layerHeight: z.string().min(1, "Layer height is required"),
  notes: z.string().optional(),
  desiredDate: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

const materials = [
  { value: "pla", label: "PLA" },
  { value: "petg", label: "PETG" },
  { value: "abs", label: "ABS" },
  { value: "asa", label: "ASA" },
  { value: "tpu", label: "TPU" },
  { value: "carbon-fiber", label: "Carbon Fiber Composite" },
  { value: "not-sure", label: "Not Sure / Need Recommendation" },
];

const layerHeights = [
  { value: "0.10", label: "0.10 mm · Ultra Detail" },
  { value: "0.16", label: "0.16 mm · High Quality" },
  { value: "0.20", label: "0.20 mm · Standard" },
  { value: "0.28", label: "0.28 mm · Draft" },
  { value: "0.32", label: "0.32 mm · Fast" },
];

const quantities = [
  { value: "1", label: "1 unit" },
  { value: "2-5", label: "2–5 units" },
  { value: "6-20", label: "6–20 units" },
  { value: "21-100", label: "21–100 units" },
  { value: "100+", label: "100+ units" },
];

export function QuoteSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (submitted) {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [submitted]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      country: "Sri Lanka",
      layerHeight: "0.20",
      quantity: "1",
    },
  });

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;
      const incoming = Array.from(newFiles);
      const valid = incoming.filter(
        (f) =>
          ACCEPTED_TYPES.some((ext) => f.name.toLowerCase().endsWith(ext)) ||
          incoming.some((x) => x.type === "application/zip")
      );
      if (valid.length > 0) {
        setFiles((prev) => [...prev, ...valid].slice(0, 10));
        setUploading(true);
        setUploadProgress(0);
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              setUploading(false);
              return 100;
            }
            return prev + Math.random() * 20 + 10;
          });
        }, 200);
      }
    },
    []
  );

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const onSubmit = async (data: QuoteFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      Object.entries({ ...data, fileCount: String(files.length) }).forEach(([key, val]) => {
        formData.append(key, val as string);
      });
      files.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/quote", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errBody.error || "Failed to submit");
      }

      setIsSubmitting(false);
      setSubmitted(true);
      reset();
      setFiles([]);
      setTimeout(() => setSubmitted(false), 6000);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setTimeout(() => setSubmitError(null), 8000);
    }
  };

  return (
    <section id="quote" ref={sectionRef} className="relative py-24 lg:py-28 border-t" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)" }}>
      <div className="max-w-[960px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <ScrollFade className="mb-14 lg:mb-16">
          <span className="text-xs font-semibold tracking-[0.15em] uppercase mb-4 block" style={{ color: "var(--color-accent-primary)" }}>
            Start Your Project
          </span>
          <h2 className="text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.02em] leading-[1.1] max-w-[700px]" style={{ color: "var(--color-text-primary)" }}>
            Tell us what you need. We'll handle the rest.
          </h2>
          <p className="text-lg mt-4 max-w-[600px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Upload your STL files, describe your project, and we'll review
            and respond with a detailed quote within 24 hours.
          </p>
        </ScrollFade>

        {/* Form */}
        {!submitted ? (
          <motion.form
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-10"
          >
            {/* File Upload */}
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                Design Files
              </h3>
              <p className="text-xs mb-4" style={{ color: "var(--color-text-secondary)" }}>
                Accepted: STL, OBJ, 3MF, STEP, ZIP &middot; Up to 250 MB per file &middot; Max 10 files
              </p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(e.dataTransfer.files);
                }}
                className="relative border-2 border-dashed rounded-2xl p-12 lg:p-16 text-center transition-colors duration-300 focus-within:ring-2 focus-within:ring-ring"
                style={
                  dragOver
                    ? { borderColor: "var(--color-accent-primary)", backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 6%, transparent)" }
                    : { borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-primary)" }
                }
              >
                <input
                  type="file"
                  id="file-upload"
                  aria-label="Design files"
                  multiple
                  accept={ACCEPTED_TYPES.join(",")}
                  onChange={(e) => handleFiles(e.target.files)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />

                <div className="relative w-16 h-16 mx-auto mb-5">
                  <div
                    className="relative w-full h-full rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-warm) 8%, transparent)", border: "1px solid var(--color-border)" }}
                  >
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-accent-warm)" }} />
                    ) : (
                      <Upload className="w-6 h-6" style={{ color: "var(--color-accent-warm)" }} />
                    )}
                  </div>
                </div>

                <p className="text-base font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
                  {dragOver ? "Drop your files here" : "Drag and drop your files here"}
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  or click to browse
                </p>

                <AnimatePresence>
                  {uploading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-5 max-w-[320px] mx-auto"
                    >
                      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-border)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: "var(--color-accent-primary)" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(uploadProgress, 100)}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                      <p className="text-xs mt-2" style={{ color: "var(--color-text-secondary)" }}>
                        {uploadProgress < 100
                          ? "Analysing file..."
                          : "File uploaded successfully"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* File List */}
              <AnimatePresence>
                {files.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-2"
                  >
                    {files.map((file, idx) => (
                      <motion.div
                        key={`${file.name}-${idx}`}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        className="flex items-center gap-3 rounded-xl px-4 py-3"
                        style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-warm) 8%, transparent)" }}
                        >
                          <FileIcon className="w-4 h-4" style={{ color: "var(--color-accent-warm)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate" style={{ color: "var(--color-text-primary)" }}>{file.name}</p>
                          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            {formatSize(file.size)} &middot; Printability:{" "}
                            <span style={{ color: "var(--color-accent-primary)" }}>Checking...</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          aria-label={`Remove ${file.name}`}
                          className="w-11 h-11 -mr-2 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <fieldset className="space-y-6">
              <legend className="mb-6 text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Your details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldWrapper label="Full Name" error={errors.name?.message} required>
                <input
                  {...register("name")}
                  type="text"
                  placeholder="Your full name"
                  className={inputClass}
                />
              </FieldWrapper>

              <FieldWrapper label="Email" error={errors.email?.message} required>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </FieldWrapper>

              <FieldWrapper label="Phone" error={errors.phone?.message} required>
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="+94 77 000 0000"
                  className={inputClass}
                />
              </FieldWrapper>

              <FieldWrapper label="Country" error={errors.country?.message} required>
                <input
                  {...register("country")}
                  type="text"
                  placeholder="Sri Lanka"
                  className={inputClass}
                />
              </FieldWrapper>

            </div>
            </fieldset>

            <fieldset className="space-y-6">
              <legend className="mb-6 text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Your project</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldWrapper label="Material" error={errors.material?.message} required>
                <select {...register("material")} className={inputClass}>
                  <option value="">Select material...</option>
                  {materials.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </FieldWrapper>

              <FieldWrapper label="Color" error={errors.color?.message} required>
                <input
                  {...register("color")}
                  type="text"
                  placeholder="e.g., Matte Black, White"
                  className={inputClass}
                />
              </FieldWrapper>

              <FieldWrapper label="Quantity" error={errors.quantity?.message} required>
                <select {...register("quantity")} className={inputClass}>
                  {quantities.map((q) => (
                    <option key={q.value} value={q.value}>
                      {q.label}
                    </option>
                  ))}
                </select>
              </FieldWrapper>

              <FieldWrapper
                label="Layer Height"
                error={errors.layerHeight?.message}
                required
              >
                <select {...register("layerHeight")} className={inputClass}>
                  {layerHeights.map((lh) => (
                    <option key={lh.value} value={lh.value}>
                      {lh.label}
                    </option>
                  ))}
                </select>
              </FieldWrapper>
            </div>

            {/* Desired Date */}
            <FieldWrapper
              label="Desired Completion Date"
              error={errors.desiredDate?.message}
            >
              <input
                {...register("desiredDate")}
                type="date"
                className={inputClass}
              />
            </FieldWrapper>

            {/* Notes */}
            <FieldWrapper label="Project Notes" error={errors.notes?.message}>
              <textarea
                {...register("notes")}
                rows={4}
                placeholder="Tell us about your project: what are you making, what's it for, any specific requirements? The more detail, the more accurate your quote."
                className={`${inputClass} !h-auto py-3 resize-none`}
              />
            </FieldWrapper>
            </fieldset>

            {/* Submit Error */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl text-sm"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-cta) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--color-cta) 25%, transparent)", color: "var(--color-cta)" }}
              >
                {submitError}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2.5 text-white disabled:opacity-50 disabled:cursor-not-allowed h-[52px] px-8 rounded-xl text-sm font-semibold transition-all duration-300 hover:brightness-110"
              style={{ backgroundColor: "var(--color-cta)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Submit Quote Request
                </>
              )}
            </button>
          </motion.form>
        ) : (
          /* Success State */
          <motion.div
            role="status"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-warm) 8%, transparent)", border: "1px solid var(--color-border)" }}
            >
              <CheckCircle className="w-8 h-8" style={{ color: "var(--color-accent-warm)" }} />
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              Quote Request Submitted
            </h3>
            <p className="max-w-[460px] mx-auto leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Thank you. We'll review your files and respond
              with a detailed quote within 24 hours. We're excited to work on your project.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}

// ── Helper Components ─────────────────────────────────

function FieldWrapper({
  label,
  error,
  children,
  required,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  const id = useId();
  const errId = `${id}-error`;
  const field = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children, { id, "aria-invalid": error ? true : undefined, "aria-describedby": error ? errId : undefined })
    : children;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold flex items-center gap-1" style={{ color: "var(--color-text-primary)" }}>
        {label}
        {required && <span style={{ color: "var(--color-cta)" }} aria-hidden="true">*</span>}
      </label>
      {field}
      {error && (
        <p id={errId} role="alert" className="text-xs mt-1" style={{ color: "var(--color-cta)" }}>{error}</p>
      )}
    </div>
  );
}

const inputClass =
  "w-full h-12 px-4 bg-background border border-border rounded-xl text-sm text-white placeholder:text-[color:var(--color-text-secondary)] focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-200";