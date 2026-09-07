"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Button } from "@/components/ui/Button";
import { ClearButton } from "@/components/ui/ClearButton";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  CARD_FONTS,
  CARD_TEMPLATES,
  DEFAULT_OPTIONS,
  EMPTY_FIELDS,
  EMPTY_INPUT,
  EXAMPLE_INPUT,
  FONT_STACKS,
  MAX_IMAGE_BYTES,
  MAX_BIO,
  SOCIAL_LABELS,
  TEMPLATE_META,
  buildDownloadVCard,
  contactPlainText,
  prepareCard,
  renderCardPng,
  renderCardQr,
  type CardFields,
  type CardFont,
  type CardInput,
  type CardSocialId,
  type CardTemplateId,
} from "@/lib/tools/digital-business-card";
import type { QrRenderResult } from "@/lib/tools/qr-code-generator";

const FIELD_ROWS = [
  { key: "fullName" as const, label: "Full name" },
  { key: "jobTitle" as const, label: "Job title" },
  { key: "company" as const, label: "Company" },
  { key: "phone" as const, label: "Phone", type: "tel" },
  { key: "email" as const, label: "Email", type: "email" },
  { key: "website" as const, label: "Website", type: "url" },
  { key: "address" as const, label: "Address" },
];

const SOCIAL_ROWS = [
  { key: "linkedin" as const, label: SOCIAL_LABELS.linkedin },
  { key: "x" as const, label: SOCIAL_LABELS.x },
  { key: "facebook" as const, label: SOCIAL_LABELS.facebook },
  { key: "instagram" as const, label: SOCIAL_LABELS.instagram },
  { key: "github" as const, label: SOCIAL_LABELS.github },
  { key: "other" as const, label: "Other URL" },
];

function SocialIcon({ id }: { id: CardSocialId }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true as const,
  };

  if (id === "linkedin") {
    return (
      <svg {...common}>
        <path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM.2 8.25h4.76V24H.2zM8.34 8.25h4.56v2.14h.06c.64-1.21 2.2-2.48 4.52-2.48 4.84 0 5.73 3.18 5.73 7.32V24h-4.76v-7.7c0-1.84-.03-4.2-2.56-4.2-2.56 0-2.95 2-2.95 4.06V24H8.34z" />
      </svg>
    );
  }
  if (id === "x") {
    return (
      <svg {...common}>
        <path d="M18.9 1.5h3.3L14.7 10l8.6 12.5h-6.7L11.2 15 5.1 22.5H1.8L10 13.2.8 1.5h6.9l5 7.2z" />
      </svg>
    );
  }
  if (id === "facebook") {
    return (
      <svg {...common}>
        <path d="M22 12.1C22 6.5 17.5 2 12 2S2 6.5 2 12.1c0 5 3.7 9.1 8.4 9.9v-7H8.1v-2.9h2.3V9.9c0-2.3 1.4-3.6 3.5-3.6 1 0 2 .2 2 .2v2.2h-1.1c-1.1 0-1.5.7-1.5 1.4v1.7h2.6l-.4 2.9h-2.2v7C18.3 21.2 22 17.1 22 12.1z" />
      </svg>
    );
  }
  if (id === "instagram") {
    return (
      <svg {...common}>
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zM18 6.8a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
      </svg>
    );
  }
  if (id === "github") {
    return (
      <svg {...common}>
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.1.39-1.99 1.03-2.7-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85 0 1.71.12 2.51.34 1.9-1.29 2.74-1.02 2.74-1.02.55 1.38.2 2.4.1 2.65.64.71 1.03 1.6 1.03 2.7 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.86v2.76c0 .26.18.58.69.48A10 10 0 0 0 12 2z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M10.6 13.4a5 5 0 0 1 0-7.07l2.12-2.12a5 5 0 0 1 7.07 7.07l-1.4 1.4-1.42-1.41 1.41-1.42a3 3 0 1 0-4.24-4.24L11.99 7.8a3 3 0 0 0 0 4.24zm2.8-2.8a5 5 0 0 1 0 7.07l-2.12 2.12a5 5 0 1 1-7.07-7.07l1.4-1.4 1.42 1.41-1.41 1.42a3 3 0 1 0 4.24 4.24l2.13-2.12a3 3 0 0 0 0-4.24z" />
    </svg>
  );
}

async function fileToDataUrl(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Keep images under 400 KB.");
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

function downloadBlob(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function CardPreview({
  input,
  qr,
}: {
  input: CardInput;
  qr: QrRenderResult | null;
}) {
  const card = useMemo(() => prepareCard(input), [input]);
  const compact = card.template === "compact";
  const bold = card.template === "bold";
  const corporate = card.template === "corporate";

  return (
    <div
      className="overflow-hidden rounded-2xl border shadow-sm"
      style={{
        background: card.backgroundColor,
        color: card.textColor,
        fontFamily: FONT_STACKS[card.font],
        borderColor: card.accentColor,
      }}
    >
      {bold ? (
        <div className="flex min-h-72">
          <div className="w-16 shrink-0" style={{ background: card.accentColor }} />
          <div className="flex-1 p-6">{CardBody({ card, qr, compact, corporate })}</div>
        </div>
      ) : (
        <div>
          <div className="h-2" style={{ background: card.accentColor }} />
          <div className={compact ? "p-5" : "p-6"}>
            {CardBody({ card, qr, compact, corporate })}
          </div>
        </div>
      )}
    </div>
  );
}

function CardBody({
  card,
  qr,
  compact,
  corporate,
}: {
  card: ReturnType<typeof prepareCard>;
  qr: QrRenderResult | null;
  compact: boolean;
  corporate: boolean;
}) {
  const photo =
    card.showPhoto && card.photoSrc ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={card.photoSrc}
        alt=""
        className="h-24 w-24 rounded-full object-cover"
      />
    ) : null;
  const logo =
    card.showLogo && card.logoSrc ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={card.logoSrc} alt="" className="h-8 max-w-28 object-contain" />
    ) : null;
  const qrImage =
    card.showQr && qr?.ok ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={qr.pngDataUrl}
        alt="Contact QR code"
        className="h-28 w-28 bg-white"
      />
    ) : null;

  const details = (
    <div className="min-w-0 space-y-1 text-sm break-words [overflow-wrap:anywhere]">
      <p className="text-2xl font-semibold">{card.fullName || "Your name"}</p>
      <p className="text-sm opacity-80">
        {[card.jobTitle, card.company].filter(Boolean).join(" · ") || "Title · Company"}
      </p>
      {card.phone ? <p>{card.phone}</p> : null}
      {card.email ? <p>{card.email}</p> : null}
      {card.website ? <p>{card.website.replace(/^https?:\/\//, "")}</p> : null}
      {card.address ? <p>{card.address}</p> : null}
      {card.bio ? <p className="pt-2 text-sm opacity-80">{card.bio}</p> : null}
      {card.showSocial && card.socials.length > 0 ? (
        <div
          className={`flex flex-wrap gap-3 pt-3 ${
            card.template === "minimal" || card.template === "bold"
              ? "justify-center"
              : ""
          }`}
        >
          {card.socials.map((social) => (
            <span
              key={social.id}
              className="inline-flex items-center gap-1 text-xs opacity-80"
              title={social.href}
            >
              <SocialIcon id={social.id} />
              <span>{social.label}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-5">
        {photo}
        <div className="min-w-0 flex-1">{details}</div>
        {qrImage}
      </div>
    );
  }

  if (corporate) {
    return (
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {photo}
        <div className="min-w-0 flex-1 space-y-3">
          {logo}
          {details}
        </div>
        {qrImage}
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">{photo}</div>
      {logo ? <div className="flex justify-center">{logo}</div> : null}
      {details}
      {qrImage ? <div className="flex justify-center">{qrImage}</div> : null}
    </div>
  );
}

export default function DigitalBusinessCardTool() {
  const formId = useId();
  const [input, setInput] = useState<CardInput>(EXAMPLE_INPUT);
  const [qr, setQr] = useState<QrRenderResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [imageError, setImageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const prepared = useMemo(() => prepareCard(input), [input]);

  useEffect(() => {
    if (!prepared.fullName) {
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void renderCardQr(input).then((result) => {
        if (!cancelled) {
          setQr(result);
        }
      });
    }, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [input, prepared.fullName]);

  function patchFields(patch: Partial<CardFields>) {
    setInput((current) => ({
      ...current,
      fields: { ...current.fields, ...patch },
    }));
    setCopyStatus("idle");
  }

  async function handleImage(
    file: File | undefined,
    key: "photoDataUrl" | "logoDataUrl",
  ) {
    if (!file) {
      return;
    }
    try {
      const url = await fileToDataUrl(file);
      setImageError(null);
      setInput((current) => ({ ...current, [key]: url }));
    } catch (caught: unknown) {
      setInput((current) => ({ ...current, [key]: null }));
      setImageError(
        caught instanceof Error ? caught.message : "The image could not be read.",
      );
    }
  }

  return (
    <ToolWorkspace
      label="Digital Business Card workspace"
      capabilities={["copy", "clear", "download"]}
      className="space-y-5"
    >
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <form
          className="min-w-0 space-y-6"
          onSubmit={(event) => event.preventDefault()}
        >
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Contact details</legend>
            {FIELD_ROWS.map((field) => (
              <div key={field.key} className="space-y-1">
                <label htmlFor={`${formId}-${field.key}`} className="text-sm font-medium">
                  {field.label}
                </label>
                <Input
                  id={`${formId}-${field.key}`}
                  type={field.type ?? "text"}
                  value={input.fields[field.key]}
                  onChange={(event) =>
                    patchFields({ [field.key]: event.target.value })
                  }
                />
              </div>
            ))}
            <div className="space-y-1">
              <label htmlFor={`${formId}-bio`} className="text-sm font-medium">
                Short bio
              </label>
              <Textarea
                id={`${formId}-bio`}
                surface="input"
                maxLength={MAX_BIO}
                className="min-h-24 font-sans text-base sm:text-sm"
                value={input.fields.bio}
                onChange={(event) => patchFields({ bio: event.target.value })}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Images</legend>
            <div className="space-y-1">
              <label htmlFor={`${formId}-photo`} className="text-sm font-medium">
                Profile photo
              </label>
              <Input
                id={`${formId}-photo`}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={(event) =>
                  void handleImage(event.target.files?.[0], "photoDataUrl")
                }
              />
              {input.photoDataUrl ? (
                <Button
                  variant="ghost"
                  onClick={() =>
                    setInput((current) => ({ ...current, photoDataUrl: null }))
                  }
                >
                  Remove photo
                </Button>
              ) : null}
            </div>
            <div className="space-y-1">
              <label htmlFor={`${formId}-logo`} className="text-sm font-medium">
                Company logo
              </label>
              <Input
                id={`${formId}-logo`}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={(event) =>
                  void handleImage(event.target.files?.[0], "logoDataUrl")
                }
              />
              {input.logoDataUrl ? (
                <Button
                  variant="ghost"
                  onClick={() =>
                    setInput((current) => ({ ...current, logoDataUrl: null }))
                  }
                >
                  Remove logo
                </Button>
              ) : null}
            </div>
            {imageError ? (
              <p className="text-xs text-danger" role="alert">
                {imageError}
              </p>
            ) : null}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Social links</legend>
            {SOCIAL_ROWS.map((field) => (
              <div key={field.key} className="space-y-1">
                <label htmlFor={`${formId}-${field.key}`} className="text-sm font-medium">
                  {field.label}
                </label>
                <Input
                  id={`${formId}-${field.key}`}
                  type="url"
                  value={input.fields[field.key]}
                  onChange={(event) =>
                    patchFields({ [field.key]: event.target.value })
                  }
                />
              </div>
            ))}
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
                  setInput((current) => ({
                    ...current,
                    options: {
                      ...current.options,
                      template: event.target.value as CardTemplateId,
                    },
                  }))
                }
              >
                {CARD_TEMPLATES.map((template) => (
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
                value={input.options.font}
                onChange={(event) =>
                  setInput((current) => ({
                    ...current,
                    options: {
                      ...current.options,
                      font: event.target.value as CardFont,
                    },
                  }))
                }
              >
                {CARD_FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font === "sans" ? "Sans" : font === "serif" ? "Serif" : "Mono"}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label htmlFor={`${formId}-accent`} className="text-sm font-medium">
                  Accent
                </label>
                <input
                  id={`${formId}-accent`}
                  type="color"
                  value={input.options.accentColor}
                  onChange={(event) =>
                    setInput((current) => ({
                      ...current,
                      options: {
                        ...current.options,
                        accentColor: event.target.value,
                      },
                    }))
                  }
                  className="h-10 w-full cursor-pointer rounded-md border border-line bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor={`${formId}-bg`} className="text-sm font-medium">
                  Background
                </label>
                <input
                  id={`${formId}-bg`}
                  type="color"
                  value={input.options.backgroundColor}
                  onChange={(event) =>
                    setInput((current) => ({
                      ...current,
                      options: {
                        ...current.options,
                        backgroundColor: event.target.value,
                      },
                    }))
                  }
                  className="h-10 w-full cursor-pointer rounded-md border border-line bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor={`${formId}-text`} className="text-sm font-medium">
                  Text
                </label>
                <input
                  id={`${formId}-text`}
                  type="color"
                  value={input.options.textColor}
                  onChange={(event) =>
                    setInput((current) => ({
                      ...current,
                      options: {
                        ...current.options,
                        textColor: event.target.value,
                      },
                    }))
                  }
                  className="h-10 w-full cursor-pointer rounded-md border border-line bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                />
              </div>
            </div>
            {(
              [
                ["showPhoto", "Show profile photo"],
                ["showLogo", "Show logo"],
                ["showQr", "Show contact QR"],
                ["showSocial", "Show social links"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={input.options[key]}
                  onChange={(event) =>
                    setInput((current) => ({
                      ...current,
                      options: {
                        ...current.options,
                        [key]: event.target.checked,
                      },
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </fieldset>
        </form>

        <div className="min-w-0 space-y-4">
          <CardPreview input={input} qr={prepared.fullName ? qr : null} />

          <Feedback>
            This is a local contact card, not a hosted page. There is no public
            URL such as infyratools.com/card/username. Photos stay on this
            device. The QR code is a static vCard generated with the existing QR
            encoder.
          </Feedback>

          {prepared.warnings.map((warning) => (
            <Feedback key={warning}>{warning}</Feedback>
          ))}
          {actionError ? (
            <Feedback tone="error" live>
              {actionError}
            </Feedback>
          ) : null}

          {!prepared.fullName ? (
            <p className="text-sm text-muted">
              Enter a name to download a vCard or PNG, or to copy contact
              details.
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="primary"
              disabled={!prepared.fullName}
              onClick={() => {
                const result = buildDownloadVCard(input);
                if (!result.ok) {
                  setActionError(result.message);
                  return;
                }
                downloadBlob(
                  `${(prepared.fullName || "contact").replace(/\s+/g, "-")}.vcf`,
                  result.vcard,
                  "text/vcard;charset=utf-8",
                );
              }}
            >
              Download vCard
            </Button>
            <Button
              disabled={!prepared.fullName}
              onClick={() => {
                void (async () => {
                  try {
                    const png = await renderCardPng(
                      input,
                      prepared.fullName && qr?.ok ? qr.pngDataUrl : null,
                    );
                    const link = document.createElement("a");
                    link.href = png;
                    link.download = "business-card.png";
                    link.click();
                  } catch (error) {
                    setActionError(
                      error instanceof Error
                        ? error.message
                        : "Could not export a PNG.",
                    );
                  }
                })();
              }}
            >
              Download PNG
            </Button>
            <Button
              disabled={!prepared.fullName}
              onClick={() => {
                void navigator.clipboard
                  .writeText(contactPlainText(prepared))
                  .then(() => setCopyStatus("copied"))
                  .catch(() => setCopyStatus("error"));
              }}
            >
              Copy contact
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setInput(EXAMPLE_INPUT);
                setCopyStatus("idle");
                setActionError(null);
              }}
            >
              Load example
            </Button>
            <ClearButton
              label="Reset"
              variant="ghost"
              onClear={() => {
                setInput({
                  ...EMPTY_INPUT,
                  fields: { ...EMPTY_FIELDS },
                  options: { ...DEFAULT_OPTIONS },
                });
                setCopyStatus("idle");
                setActionError(null);
                setImageError(null);
                setQr(null);
              }}
            />
          </div>
          {copyStatus === "copied" ? (
            <Feedback tone="success" live>
              Copied contact details as text.
            </Feedback>
          ) : null}
          {copyStatus === "error" ? (
            <Feedback tone="error" live>
              Could not copy. Download the vCard instead.
            </Feedback>
          ) : null}
        </div>
      </div>
    </ToolWorkspace>
  );
}
