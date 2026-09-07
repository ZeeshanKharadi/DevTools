import type {
  QrErrorCorrection,
  QrFields,
  QrInput,
  QrStyle,
  QrType,
  WifiAuth,
} from "./types";
import { QR_ERROR_LEVELS, QR_TYPES, WIFI_AUTH_TYPES } from "./types";

export const MIN_QR_SIZE = 128;
export const MAX_QR_SIZE = 1024;
export const DEFAULT_QR_SIZE = 280;

export const MIN_QR_MARGIN = 0;
export const MAX_QR_MARGIN = 8;
export const DEFAULT_QR_MARGIN = 2;

export const DEFAULT_FOREGROUND = "#1b1914";
export const DEFAULT_BACKGROUND = "#ffffff";

export const DEFAULT_ERROR_CORRECTION: QrErrorCorrection = "M";

export const MAX_TEXT_CHARS = 1200;
export const MAX_PAYLOAD_BYTES = 1500;
export const MAX_SSID_CHARS = 32;
export const MAX_WIFI_PASSWORD_CHARS = 63;
export const MAX_LOGO_BYTES = 200_000;
export const LOGO_SIZE_RATIO = 0.18;

export const QR_TYPE_LABELS: Record<QrType, string> = {
  url: "URL",
  text: "Plain text",
  email: "Email",
  phone: "Phone",
  sms: "SMS",
  wifi: "Wi-Fi",
  vcard: "vCard / contact",
};

export const ERROR_CORRECTION_LABELS: Record<QrErrorCorrection, string> = {
  L: "L — ~7% recovery",
  M: "M — ~15% recovery",
  Q: "Q — ~25% recovery",
  H: "H — ~30% recovery",
};

export const WIFI_AUTH_LABELS: Record<WifiAuth, string> = {
  WPA: "WPA / WPA2 / WPA3",
  WEP: "WEP",
  nopass: "No password",
};

export const EMPTY_FIELDS: QrFields = {
  url: "",
  text: "",
  email: "",
  emailSubject: "",
  emailBody: "",
  phone: "",
  smsPhone: "",
  smsBody: "",
  wifiSsid: "",
  wifiPassword: "",
  wifiAuth: "WPA",
  wifiHidden: false,
  vcardFirstName: "",
  vcardLastName: "",
  vcardOrganization: "",
  vcardTitle: "",
  vcardPhone: "",
  vcardEmail: "",
  vcardWebsite: "",
  vcardStreet: "",
  vcardCity: "",
  vcardRegion: "",
  vcardPostalCode: "",
  vcardCountry: "",
};

export const DEFAULT_STYLE: QrStyle = {
  size: DEFAULT_QR_SIZE,
  foreground: DEFAULT_FOREGROUND,
  background: DEFAULT_BACKGROUND,
  errorCorrection: DEFAULT_ERROR_CORRECTION,
  margin: DEFAULT_QR_MARGIN,
};

export const EMPTY_INPUT: QrInput = {
  type: "url",
  fields: EMPTY_FIELDS,
  style: DEFAULT_STYLE,
  logoDataUrl: null,
};

export const EXAMPLE_INPUT: QrInput = {
  type: "url",
  fields: {
    ...EMPTY_FIELDS,
    url: "https://example.com",
  },
  style: DEFAULT_STYLE,
  logoDataUrl: null,
};

export function isQrType(value: string): value is QrType {
  return (QR_TYPES as readonly string[]).includes(value);
}

export function isQrErrorCorrection(value: string): value is QrErrorCorrection {
  return (QR_ERROR_LEVELS as readonly string[]).includes(value);
}

export function isWifiAuth(value: string): value is WifiAuth {
  return (WIFI_AUTH_TYPES as readonly string[]).includes(value);
}
