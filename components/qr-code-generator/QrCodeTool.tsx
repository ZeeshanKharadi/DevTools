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
  DEFAULT_STYLE,
  EMPTY_FIELDS,
  EMPTY_INPUT,
  ERROR_CORRECTION_LABELS,
  EXAMPLE_INPUT,
  MAX_LOGO_BYTES,
  MAX_QR_MARGIN,
  MAX_QR_SIZE,
  MIN_QR_MARGIN,
  MIN_QR_SIZE,
  QR_ERROR_LEVELS,
  QR_TYPE_LABELS,
  QR_TYPES,
  WIFI_AUTH_LABELS,
  WIFI_AUTH_TYPES,
  buildQrPayload,
  renderStaticQr,
  type QrErrorCorrection,
  type QrFields,
  type QrInput,
  type QrRenderResult,
  type QrStyle,
  type QrType,
  type WifiAuth,
} from "@/lib/tools/qr-code-generator";

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
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
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

async function fileToDataUrl(file: File): Promise<string> {
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error(
      `Keep logos under ${Math.round(MAX_LOGO_BYTES / 1024)} KB so the QR code stays scannable.`,
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

      reject(new Error("The logo could not be read."));
    };
    reader.onerror = () => reject(new Error("The logo could not be read."));
    reader.readAsDataURL(file);
  });
}

function downloadFile(filename: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(filename: string, dataUrl: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function canCopyImage(): boolean {
  return (
    typeof ClipboardItem !== "undefined" &&
    typeof navigator.clipboard?.write === "function"
  );
}

export default function QrCodeTool() {
  const formId = useId();
  const [input, setInput] = useState<QrInput>(EXAMPLE_INPUT);
  const [render, setRender] = useState<QrRenderResult | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unsupported" | "error">(
    "idle",
  );

  const payload = useMemo(
    () => buildQrPayload(input.type, input.fields),
    [input.type, input.fields],
  );

  useEffect(() => {
    if (!payload.ok) {
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(() => {
      void renderStaticQr(input).then((result) => {
        if (!cancelled) {
          setRender(result);
        }
      });
    }, 60);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [input, payload]);

  const display: QrRenderResult | null = payload.ok ? render : payload;

  function patchFields(patch: Partial<QrFields>) {
    setInput((current) => ({
      ...current,
      fields: { ...current.fields, ...patch },
    }));
    setCopyStatus("idle");
  }

  function patchStyle(patch: Partial<QrStyle>) {
    setInput((current) => ({
      ...current,
      style: { ...current.style, ...patch },
    }));
    setCopyStatus("idle");
  }

  function handleTypeChange(type: QrType) {
    setInput((current) => ({ ...current, type }));
    setCopyStatus("idle");
  }

  async function handleCopyImage() {
    if (!display || !display.ok) {
      return;
    }

    if (!canCopyImage()) {
      setCopyStatus("unsupported");
      return;
    }

    try {
      const response = await fetch(display.pngDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  const previewSrc = display?.ok ? display.pngDataUrl : null;
  const previewSize = Math.min(input.style.size, 320);

  return (
    <ToolWorkspace
      label="QR Code Generator workspace"
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
            <legend className="text-sm font-semibold">QR content</legend>
            <div className="space-y-1">
              <label htmlFor={`${formId}-type`} className="text-sm font-medium">
                Type
              </label>
              <Select
                id={`${formId}-type`}
                value={input.type}
                onChange={(event) => handleTypeChange(event.target.value as QrType)}
              >
                {QR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {QR_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </div>
            {input.type === "url" ? (
              <Field
                id={`${formId}-url`}
                label="URL"
                type="url"
                placeholder="https://"
                autoComplete="url"
                value={input.fields.url}
                onChange={(url) => patchFields({ url })}
              />
            ) : null}
            {input.type === "text" ? (
              <div className="space-y-1">
                <label htmlFor={`${formId}-text`} className="text-sm font-medium">
                  Text
                </label>
                <Textarea
                  id={`${formId}-text`}
                  surface="input"
                  className="min-h-32 font-sans"
                  value={input.fields.text}
                  onChange={(event) => patchFields({ text: event.target.value })}
                />
              </div>
            ) : null}
            {input.type === "email" ? (
              <>
                <Field
                  id={`${formId}-email`}
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={input.fields.email}
                  onChange={(email) => patchFields({ email })}
                />
                <Field
                  id={`${formId}-subject`}
                  label="Subject (optional)"
                  value={input.fields.emailSubject}
                  onChange={(emailSubject) => patchFields({ emailSubject })}
                />
                <div className="space-y-1">
                  <label htmlFor={`${formId}-body`} className="text-sm font-medium">
                    Message (optional)
                  </label>
                  <Textarea
                    id={`${formId}-body`}
                    surface="input"
                    className="min-h-28 font-sans"
                    value={input.fields.emailBody}
                    onChange={(event) =>
                      patchFields({ emailBody: event.target.value })
                    }
                  />
                </div>
              </>
            ) : null}
            {input.type === "phone" ? (
              <Field
                id={`${formId}-phone`}
                label="Phone"
                type="tel"
                autoComplete="tel"
                value={input.fields.phone}
                onChange={(phone) => patchFields({ phone })}
              />
            ) : null}
            {input.type === "sms" ? (
              <>
                <Field
                  id={`${formId}-sms-phone`}
                  label="Phone"
                  type="tel"
                  autoComplete="tel"
                  value={input.fields.smsPhone}
                  onChange={(smsPhone) => patchFields({ smsPhone })}
                />
                <div className="space-y-1">
                  <label htmlFor={`${formId}-sms-body`} className="text-sm font-medium">
                    Message (optional)
                  </label>
                  <Textarea
                    id={`${formId}-sms-body`}
                    surface="input"
                    className="min-h-28 font-sans"
                    value={input.fields.smsBody}
                    onChange={(event) =>
                      patchFields({ smsBody: event.target.value })
                    }
                  />
                </div>
              </>
            ) : null}
            {input.type === "wifi" ? (
              <>
                <Field
                  id={`${formId}-ssid`}
                  label="Network name (SSID)"
                  value={input.fields.wifiSsid}
                  onChange={(wifiSsid) => patchFields({ wifiSsid })}
                />
                <div className="space-y-1">
                  <label htmlFor={`${formId}-auth`} className="text-sm font-medium">
                    Security
                  </label>
                  <Select
                    id={`${formId}-auth`}
                    value={input.fields.wifiAuth}
                    onChange={(event) =>
                      patchFields({ wifiAuth: event.target.value as WifiAuth })
                    }
                  >
                    {WIFI_AUTH_TYPES.map((auth) => (
                      <option key={auth} value={auth}>
                        {WIFI_AUTH_LABELS[auth]}
                      </option>
                    ))}
                  </Select>
                </div>
                {input.fields.wifiAuth !== "nopass" ? (
                  <Field
                    id={`${formId}-wifi-password`}
                    label="Password"
                    type="password"
                    autoComplete="off"
                    value={input.fields.wifiPassword}
                    onChange={(wifiPassword) => patchFields({ wifiPassword })}
                  />
                ) : null}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={input.fields.wifiHidden}
                    onChange={(event) =>
                      patchFields({ wifiHidden: event.target.checked })
                    }
                  />
                  Hidden network
                </label>
              </>
            ) : null}
            {input.type === "vcard" ? (
              <>
                <Field
                  id={`${formId}-first`}
                  label="First name"
                  autoComplete="given-name"
                  value={input.fields.vcardFirstName}
                  onChange={(vcardFirstName) => patchFields({ vcardFirstName })}
                />
                <Field
                  id={`${formId}-last`}
                  label="Last name"
                  autoComplete="family-name"
                  value={input.fields.vcardLastName}
                  onChange={(vcardLastName) => patchFields({ vcardLastName })}
                />
                <Field
                  id={`${formId}-org`}
                  label="Organization"
                  autoComplete="organization"
                  value={input.fields.vcardOrganization}
                  onChange={(vcardOrganization) =>
                    patchFields({ vcardOrganization })
                  }
                />
                <Field
                  id={`${formId}-title`}
                  label="Title"
                  autoComplete="organization-title"
                  value={input.fields.vcardTitle}
                  onChange={(vcardTitle) => patchFields({ vcardTitle })}
                />
                <Field
                  id={`${formId}-vcard-phone`}
                  label="Phone"
                  type="tel"
                  autoComplete="tel"
                  value={input.fields.vcardPhone}
                  onChange={(vcardPhone) => patchFields({ vcardPhone })}
                />
                <Field
                  id={`${formId}-vcard-email`}
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={input.fields.vcardEmail}
                  onChange={(vcardEmail) => patchFields({ vcardEmail })}
                />
                <Field
                  id={`${formId}-vcard-web`}
                  label="Website"
                  type="url"
                  autoComplete="url"
                  placeholder="https://"
                  value={input.fields.vcardWebsite}
                  onChange={(vcardWebsite) => patchFields({ vcardWebsite })}
                />
                <Field
                  id={`${formId}-street`}
                  label="Street"
                  autoComplete="street-address"
                  value={input.fields.vcardStreet}
                  onChange={(vcardStreet) => patchFields({ vcardStreet })}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    id={`${formId}-city`}
                    label="City"
                    autoComplete="address-level2"
                    value={input.fields.vcardCity}
                    onChange={(vcardCity) => patchFields({ vcardCity })}
                  />
                  <Field
                    id={`${formId}-region`}
                    label="Region"
                    autoComplete="address-level1"
                    value={input.fields.vcardRegion}
                    onChange={(vcardRegion) => patchFields({ vcardRegion })}
                  />
                  <Field
                    id={`${formId}-postal`}
                    label="Postal code"
                    autoComplete="postal-code"
                    value={input.fields.vcardPostalCode}
                    onChange={(vcardPostalCode) =>
                      patchFields({ vcardPostalCode })
                    }
                  />
                  <Field
                    id={`${formId}-country`}
                    label="Country"
                    autoComplete="country-name"
                    value={input.fields.vcardCountry}
                    onChange={(vcardCountry) => patchFields({ vcardCountry })}
                  />
                </div>
              </>
            ) : null}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Appearance</legend>
            <div className="space-y-1">
              <label htmlFor={`${formId}-size`} className="text-sm font-medium">
                Size ({input.style.size}px)
              </label>
              <input
                id={`${formId}-size`}
                type="range"
                min={MIN_QR_SIZE}
                max={MAX_QR_SIZE}
                step={8}
                value={input.style.size}
                onChange={(event) =>
                  patchStyle({ size: Number(event.target.value) })
                }
                className="w-full accent-brand"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${formId}-margin`} className="text-sm font-medium">
                Margin ({input.style.margin} modules)
              </label>
              <input
                id={`${formId}-margin`}
                type="range"
                min={MIN_QR_MARGIN}
                max={MAX_QR_MARGIN}
                step={1}
                value={input.style.margin}
                onChange={(event) =>
                  patchStyle({ margin: Number(event.target.value) })
                }
                className="w-full accent-brand"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${formId}-ecc`} className="text-sm font-medium">
                Error correction
              </label>
              <Select
                id={`${formId}-ecc`}
                value={input.style.errorCorrection}
                onChange={(event) =>
                  patchStyle({
                    errorCorrection: event.target.value as QrErrorCorrection,
                  })
                }
              >
                {QR_ERROR_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {ERROR_CORRECTION_LABELS[level]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor={`${formId}-fg`} className="text-sm font-medium">
                  Foreground
                </label>
                <input
                  id={`${formId}-fg`}
                  type="color"
                  value={input.style.foreground}
                  onChange={(event) =>
                    patchStyle({ foreground: event.target.value })
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
                  value={input.style.background}
                  onChange={(event) =>
                    patchStyle({ background: event.target.value })
                  }
                  className="h-10 w-full cursor-pointer rounded-md border border-line bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                />
              </div>
            </div>
            <div className="space-y-2 rounded-lg border border-line p-3">
              <p className="text-sm font-medium">Center logo (optional)</p>
              <label htmlFor={`${formId}-logo`} className="text-xs text-muted">
                PNG, JPEG, GIF, or WebP. Kept small and encoded with high error
                correction so the code can still scan.
              </label>
              <Input
                id={`${formId}-logo`}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  void fileToDataUrl(file)
                    .then((url) => {
                      setLogoError(null);
                      setInput((current) => ({
                        ...current,
                        logoDataUrl: url,
                      }));
                    })
                    .catch((caught: unknown) => {
                      setInput((current) => ({ ...current, logoDataUrl: null }));
                      setLogoError(
                        caught instanceof Error
                          ? caught.message
                          : "The logo could not be read.",
                      );
                    });
                }}
              />
              {input.logoDataUrl ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setLogoError(null);
                    setInput((current) => ({ ...current, logoDataUrl: null }));
                  }}
                >
                  Remove logo
                </Button>
              ) : null}
              {logoError ? (
                <p className="text-xs text-danger" role="alert">
                  {logoError}
                </p>
              ) : null}
            </div>
          </fieldset>
        </form>

        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-xl border border-line bg-canvas">
            <div className="border-b border-line bg-panel px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Live QR preview
              </p>
              <p className="mt-1 text-sm text-foreground">
                {QR_TYPE_LABELS[input.type]} · static QR code
              </p>
            </div>
            <div className="flex min-h-72 items-center justify-center bg-white p-6">
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt="Generated static QR code preview"
                  width={input.style.size}
                  height={input.style.size}
                  className="max-h-80 w-auto max-w-full"
                  style={{ width: previewSize, height: previewSize }}
                />
              ) : (
                <p className="max-w-xs text-center text-sm text-muted">
                  {display && !display.ok
                    ? display.message
                    : "Add content to generate a QR code."}
                </p>
              )}
            </div>
          </div>

          <Feedback>
            This is a static QR code. The destination is encoded in the image
            and cannot be changed later. A new code is required if the URL,
            Wi-Fi details, or contact information change. Dynamic QR codes,
            scan analytics, and hosted short URLs would need a server and are
            not part of this browser-only generator.
          </Feedback>

          {display?.ok
            ? display.warnings.map((warning) => (
                <Feedback key={warning} tone="empty">
                  {warning}
                </Feedback>
              ))
            : null}

          {display && !display.ok ? (
            <Feedback tone="error" live>
              {display.message}
            </Feedback>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="primary"
              disabled={!display?.ok}
              onClick={() => {
                if (display?.ok) {
                  downloadDataUrl("qr-code.png", display.pngDataUrl);
                }
              }}
            >
              Download PNG
            </Button>
            <Button
              disabled={!display?.ok}
              onClick={() => {
                if (display?.ok) {
                  downloadFile("qr-code.svg", display.svg, "image/svg+xml;charset=utf-8");
                }
              }}
            >
              Download SVG
            </Button>
            <Button disabled={!display?.ok} onClick={() => void handleCopyImage()}>
              Copy QR image
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setInput(EXAMPLE_INPUT);
                setCopyStatus("idle");
                setLogoError(null);
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
                  style: { ...DEFAULT_STYLE },
                });
                setCopyStatus("idle");
                setLogoError(null);
              }}
            />
          </div>

          {copyStatus === "copied" ? (
            <Feedback tone="success" live>
              Copied the QR image to the clipboard.
            </Feedback>
          ) : null}
          {copyStatus === "unsupported" ? (
            <Feedback tone="empty" live>
              This browser does not allow copying images. Download PNG instead.
            </Feedback>
          ) : null}
          {copyStatus === "error" ? (
            <Feedback tone="error" live>
              Could not copy the image. Download PNG instead.
            </Feedback>
          ) : null}

          {payload.ok ? (
            <details className="rounded-lg border border-line bg-panel p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Encoded payload
              </summary>
              <p className="mt-2 text-xs text-muted">
                Wi-Fi passwords and other secrets appear here because they are
                stored in a static QR code. This text is not executed.
              </p>
              <Textarea
                className="mt-3 min-h-32"
                readOnly
                spellCheck={false}
                value={payload.payload}
                aria-label="Encoded QR payload"
              />
            </details>
          ) : null}
        </div>
      </div>
    </ToolWorkspace>
  );
}
