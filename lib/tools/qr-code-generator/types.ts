/**
 * V1 generates static QR codes only. The payload is baked into the image;
 * the destination cannot be changed after generation.
 *
 * Future Pro/server features must live in a separate module and must not
 * be imported by this encoder: dynamic QR codes, editable destinations,
 * scan analytics, saved QR codes, custom domains, bulk generation,
 * premium designs, and hosted short URLs.
 */
export const QR_GENERATION_MODE = "static" as const;
export type QrGenerationMode = typeof QR_GENERATION_MODE;

export const QR_PRO_FEATURES = [
  "dynamic-qr",
  "editable-destinations",
  "scan-analytics",
  "saved-qr-codes",
  "custom-domains",
  "bulk-generation",
  "premium-designs",
  "hosted-short-urls",
] as const;

export type QrProFeature = (typeof QR_PRO_FEATURES)[number];

export const QR_TYPES = [
  "url",
  "text",
  "email",
  "phone",
  "sms",
  "wifi",
  "vcard",
] as const;

export type QrType = (typeof QR_TYPES)[number];

export const QR_ERROR_LEVELS = ["L", "M", "Q", "H"] as const;
export type QrErrorCorrection = (typeof QR_ERROR_LEVELS)[number];

export const WIFI_AUTH_TYPES = ["WPA", "WEP", "nopass"] as const;
export type WifiAuth = (typeof WIFI_AUTH_TYPES)[number];

export type QrFields = {
  url: string;
  text: string;
  email: string;
  emailSubject: string;
  emailBody: string;
  phone: string;
  smsPhone: string;
  smsBody: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiAuth: WifiAuth;
  wifiHidden: boolean;
  vcardFirstName: string;
  vcardLastName: string;
  vcardOrganization: string;
  vcardTitle: string;
  vcardPhone: string;
  vcardEmail: string;
  vcardWebsite: string;
  vcardStreet: string;
  vcardCity: string;
  vcardRegion: string;
  vcardPostalCode: string;
  vcardCountry: string;
};

export type QrStyle = {
  size: number;
  foreground: string;
  background: string;
  errorCorrection: QrErrorCorrection;
  margin: number;
};

export type QrInput = {
  type: QrType;
  fields: QrFields;
  style: QrStyle;
  logoDataUrl: string | null;
};

export type QrPayloadResult =
  | { ok: true; payload: string; warnings: string[] }
  | { ok: false; message: string };

export type QrRenderResult =
  | {
      ok: true;
      payload: string;
      pngDataUrl: string;
      svg: string;
      warnings: string[];
      errorCorrection: QrErrorCorrection;
      mode: QrGenerationMode;
    }
  | { ok: false; message: string };
