"use client";

import { Suspense, useEffect, useId, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SignatureSaveControls } from "@/components/email-signature-generator/SignatureSaveControls";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Button } from "@/components/ui/Button";
import { ClearButton } from "@/components/ui/ClearButton";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  EMAIL_SAFE_FONTS,
  EMPTY_IMAGE,
  EMPTY_INPUT,
  EXAMPLE_INPUT,
  MAX_IMAGE_BYTES,
  SIGNATURE_TEMPLATES,
  TEMPLATE_META,
  copyRichHtml,
  renderSignature,
  type EmailSafeFont,
  type SignatureFields,
  type SignatureFontSize,
  type SignatureImage,
  type SignatureInput,
  type SignatureOptions,
  type SignatureTemplateId,
} from "@/lib/tools/email-signature-generator";
import { getSignature } from "@/lib/pro/api";

const FONT_LABELS: Record<EmailSafeFont, string> = {
  arial: "Arial",
  helvetica: "Helvetica",
  georgia: "Georgia",
  times: "Times New Roman",
  tahoma: "Tahoma",
  verdana: "Verdana",
  trebuchet: "Trebuchet MS",
  courier: "Courier New",
};

const ACCENT_PRESETS = ["#0f6e56", "#1e3a5f", "#7a1f1f", "#3f3f46", "#b45309"];

type FieldKey = keyof SignatureFields;

const DETAIL_FIELDS: { key: FieldKey; label: string; type?: string; autoComplete?: string }[] = [
  { key: "fullName", label: "Full name", autoComplete: "name" },
  { key: "jobTitle", label: "Job title", autoComplete: "organization-title" },
  { key: "company", label: "Company", autoComplete: "organization" },
  { key: "email", label: "Email", type: "email", autoComplete: "email" },
  { key: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  { key: "website", label: "Website", type: "url", autoComplete: "url" },
  { key: "address", label: "Address", autoComplete: "street-address" },
];

const SOCIAL_FIELDS: { key: FieldKey; label: string }[] = [
  { key: "linkedin", label: "LinkedIn URL" },
  { key: "x", label: "X / Twitter URL" },
  { key: "facebook", label: "Facebook URL" },
  { key: "instagram", label: "Instagram URL" },
  { key: "github", label: "GitHub URL" },
];

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

async function fileToDataUrl(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `Keep images under ${Math.round(MAX_IMAGE_BYTES / 1024)} KB so the signature HTML stays small.`,
    );
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a PNG, JPEG, GIF, or WebP image.");
  }

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("The image could not be read."));
    };
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(file);
  });
}

function ImageField({
  id,
  label,
  image,
  onChange,
  onError,
  error,
}: {
  id: string;
  label: string;
  image: SignatureImage;
  onChange: (image: SignatureImage) => void;
  onError: (message: string | null) => void;
  error: string | null;
}) {
  const fileId = `${id}-file`;
  const urlId = `${id}-url`;

  return (
    <div className="space-y-2 rounded-lg border border-line p-3">
      <p className="text-sm font-medium">{label}</p>
      <div className="space-y-1">
        <label htmlFor={fileId} className="text-xs text-muted">
          Local image (preview; usually not visible to recipients)
        </label>
        <Input
          id={fileId}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            void fileToDataUrl(file)
              .then((url) => {
                onError(null);
                onChange({ origin: "local", url });
              })
              .catch((caught: unknown) => {
                onChange(EMPTY_IMAGE);
                onError(
                  caught instanceof Error
                    ? caught.message
                    : "The image could not be read.",
                );
              });
          }}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={urlId} className="text-xs text-muted">
          Hosted image URL (https) — works for recipients
        </label>
        <Input
          id={urlId}
          type="url"
          placeholder="https://"
          value={image.origin === "hosted" ? image.url : ""}
          onChange={(event) => {
            const url = event.target.value;
            onError(null);
            onChange(url.trim() ? { origin: "hosted", url } : EMPTY_IMAGE);
          }}
        />
      </div>
      {image.origin !== "none" ? (
        <Button
          variant="ghost"
          onClick={() => {
            onError(null);
            onChange(EMPTY_IMAGE);
          }}
        >
          Remove {label.toLowerCase()}
        </Button>
      ) : null}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function EmailSignatureTool() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading signature editor…</p>}>
      <EmailSignatureEditor />
    </Suspense>
  );
}

function EmailSignatureEditor() {
  const formId = useId();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("signature");
  const [input, setInput] = useState<SignatureInput>(EXAMPLE_INPUT);
  const [copyStatus, setCopyStatus] = useState<"idle" | "html" | "rich" | "error">("idle");
  const [copyError, setCopyError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedName, setSavedName] = useState("Work Signature");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestedId) {
      return;
    }

    void getSignature(requestedId)
      .then((result) => {
        setInput(result.signature.data as SignatureInput);
        setSavedId(result.signature.id);
        setSavedName(result.signature.name);
        setLoadError(null);
      })
      .catch(() => {
        setLoadError("That saved signature could not be opened. Sign in and try again.");
      });
  }, [requestedId]);

  const rendered = useMemo(() => renderSignature(input), [input]);

  function patchFields(patch: Partial<SignatureFields>) {
    setInput((current) => ({
      ...current,
      fields: { ...current.fields, ...patch },
    }));
    setCopyStatus("idle");
  }

  function patchOptions(patch: Partial<SignatureOptions>) {
    setInput((current) => ({
      ...current,
      options: { ...current.options, ...patch },
    }));
    setCopyStatus("idle");
  }

  async function handleCopyRich() {
    setCopyError(null);

    try {
      await copyRichHtml(rendered.html, rendered.plainText);
      setCopyStatus("rich");
    } catch {
      setCopyStatus("error");
      setCopyError("Could not copy a rich signature. Try Copy HTML instead.");
    }
  }

  async function handleCopyMarkup() {
    setCopyError(null);

    try {
      await navigator.clipboard.writeText(rendered.html);
      setCopyStatus("html");
    } catch {
      setCopyStatus("error");
      setCopyError("Could not copy HTML.");
    }
  }

  return (
    <ToolWorkspace
      label="Email Signature Generator workspace"
      capabilities={["copy", "clear", "download"]}
      className="space-y-5"
    >
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <form
          id={formId}
          className="min-w-0 space-y-6"
          onSubmit={(event) => event.preventDefault()}
        >
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Your details</legend>
            {DETAIL_FIELDS.map((field) => (
              <Field
                key={field.key}
                id={`${formId}-${field.key}`}
                label={field.label}
                type={field.type}
                autoComplete={field.autoComplete}
                value={input.fields[field.key]}
                onChange={(value) => patchFields({ [field.key]: value })}
              />
            ))}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Images</legend>
            <ImageField
              id={`${formId}-photo`}
              label="Profile photo"
              image={input.photo}
              error={photoError}
              onError={setPhotoError}
              onChange={(photo) => {
                setInput((current) => ({ ...current, photo }));
              }}
            />
            <ImageField
              id={`${formId}-logo`}
              label="Company logo"
              image={input.logo}
              error={logoError}
              onError={setLogoError}
              onChange={(logo) => {
                setInput((current) => ({ ...current, logo }));
              }}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={input.options.showPhoto}
                onChange={(event) => patchOptions({ showPhoto: event.target.checked })}
              />
              Show profile photo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={input.options.showLogo}
                onChange={(event) => patchOptions({ showLogo: event.target.checked })}
              />
              Show company logo
            </label>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Social links</legend>
            {SOCIAL_FIELDS.map((field) => (
              <Field
                key={field.key}
                id={`${formId}-${field.key}`}
                label={field.label}
                type="url"
                value={input.fields[field.key]}
                onChange={(value) => patchFields({ [field.key]: value })}
              />
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={input.options.showSocial}
                onChange={(event) => patchOptions({ showSocial: event.target.checked })}
              />
              Show social links
            </label>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Style</legend>
            <div className="space-y-1">
              <label htmlFor={`${formId}-template`} className="text-sm font-medium">
                Template
              </label>
              <Select
                id={`${formId}-template`}
                value={input.options.template}
                onChange={(event) =>
                  patchOptions({
                    template: event.target.value as SignatureTemplateId,
                  })
                }
              >
                {SIGNATURE_TEMPLATES.map((template) => (
                  <option key={template} value={template}>
                    {TEMPLATE_META[template].label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted">
                {TEMPLATE_META[input.options.template].description}
              </p>
            </div>
            <div className="space-y-1">
              <label htmlFor={`${formId}-font`} className="text-sm font-medium">
                Font
              </label>
              <Select
                id={`${formId}-font`}
                value={input.options.fontFamily}
                onChange={(event) =>
                  patchOptions({
                    fontFamily: event.target.value as EmailSafeFont,
                  })
                }
              >
                {EMAIL_SAFE_FONTS.map((font) => (
                  <option key={font} value={font}>
                    {FONT_LABELS[font]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor={`${formId}-size`} className="text-sm font-medium">
                Font size
              </label>
              <Select
                id={`${formId}-size`}
                value={input.options.fontSize}
                onChange={(event) =>
                  patchOptions({
                    fontSize: event.target.value as SignatureFontSize,
                  })
                }
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor={`${formId}-accent`} className="text-sm font-medium">
                Accent color
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id={`${formId}-accent`}
                  type="color"
                  value={input.options.accentColor}
                  onChange={(event) => patchOptions({ accentColor: event.target.value })}
                  className="h-10 w-14 cursor-pointer rounded-md border border-line bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                />
                {ACCENT_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Use accent ${color}`}
                    onClick={() => patchOptions({ accentColor: color })}
                    className="h-8 w-8 rounded-full border border-line"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor={`${formId}-text`} className="text-sm font-medium">
                Text color
              </label>
              <input
                id={`${formId}-text`}
                type="color"
                value={input.options.textColor}
                onChange={(event) => patchOptions({ textColor: event.target.value })}
                className="h-10 w-14 cursor-pointer rounded-md border border-line bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={input.options.showDivider}
                onChange={(event) => patchOptions({ showDivider: event.target.checked })}
              />
              Show divider / accent rule
            </label>
          </fieldset>
        </form>

        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-xl border border-line bg-canvas">
            <div className="border-b border-line bg-panel px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Email preview
              </p>
              <p className="mt-1 text-sm text-foreground">
                From {input.fields.fullName || "You"}{" "}
                {input.fields.email ? `<${input.fields.email}>` : ""}
              </p>
              <p className="text-sm text-muted">Subject: Quick update</p>
            </div>
            <div className="bg-white p-4">
              <iframe
                title="Email signature preview"
                sandbox=""
                srcDoc={rendered.html || "<p style='font-family:Arial,sans-serif;color:#5e594f'>Add your details to build a signature.</p>"}
                className="min-h-64 w-full border-0 bg-white"
                style={{ colorScheme: "light" }}
              />
            </div>
          </div>

          <Feedback>
            Local photos and logos can appear in this preview because they stay on
            your device. They are not a substitute for hosted https:// images.
            Recipients usually will not see blob or data URLs. A later Pro option
            can host images without changing this signature engine.
          </Feedback>

          {rendered.warnings.map((warning) => (
            <Feedback key={warning} tone="empty">
              {warning}
            </Feedback>
          ))}

          {loadError ? (
            <Feedback tone="error" live>
              {loadError}
            </Feedback>
          ) : null}

          <SignatureSaveControls
            key={savedId ?? "new"}
            input={input}
            savedId={savedId}
            savedName={savedName}
            onSaved={(id, name, warnings) => {
              setSavedId(id);
              setSavedName(name);
              if (warnings.length > 0) {
                setLoadError(null);
              }
            }}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button variant="primary" onClick={() => void handleCopyRich()}>
              Copy signature
            </Button>
            <Button onClick={() => void handleCopyMarkup()}>Copy HTML</Button>
            <DownloadButton
              value={rendered.document}
              filename="email-signature.html"
              mimeType="text/html;charset=utf-8"
              label="Download HTML"
            />
            <Button
              variant="ghost"
              onClick={() => {
                setInput(EXAMPLE_INPUT);
                setCopyStatus("idle");
              }}
            >
              Load example
            </Button>
            <ClearButton
              label="Reset"
              variant="ghost"
              onClear={() => {
                setInput(EMPTY_INPUT);
                setCopyStatus("idle");
                setPhotoError(null);
                setLogoError(null);
              }}
            />
          </div>

          {copyStatus === "rich" ? (
            <Feedback tone="success" live>
              Copied as rich HTML. Paste it into Gmail, Outlook, or Apple Mail
              signature settings.
            </Feedback>
          ) : null}
          {copyStatus === "html" ? (
            <Feedback tone="success" live>
              Copied the HTML source.
            </Feedback>
          ) : null}
          {copyError ? (
            <Feedback tone="error" live>
              {copyError}
            </Feedback>
          ) : null}

          <details className="rounded-lg border border-line bg-panel p-3">
            <summary className="cursor-pointer text-sm font-medium">
              View HTML
            </summary>
            <Textarea
              className="mt-3 min-h-48"
              readOnly
              spellCheck={false}
              value={rendered.html}
              aria-label="Generated email signature HTML"
            />
          </details>
        </div>
      </div>
    </ToolWorkspace>
  );
}
