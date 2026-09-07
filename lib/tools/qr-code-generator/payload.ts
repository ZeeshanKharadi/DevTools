import {
  MAX_PAYLOAD_BYTES,
  MAX_SSID_CHARS,
  MAX_TEXT_CHARS,
  MAX_WIFI_PASSWORD_CHARS,
  isQrType,
  isWifiAuth,
} from "./constants";
import {
  contrastRatio,
  escapeVCardValue,
  escapeWifiValue,
  foldVCardLine,
  sanitizeColor,
  sanitizeEmail,
  sanitizeHttpUrl,
  sanitizePhone,
  stripControlChars,
  telDigits,
  trimField,
  utf8ByteLength,
} from "./sanitize";
import { DEFAULT_BACKGROUND, DEFAULT_FOREGROUND } from "./constants";
import type { QrFields, QrPayloadResult, QrType } from "./types";

function fail(message: string): QrPayloadResult {
  return { ok: false, message };
}

function succeed(payload: string, warnings: string[] = []): QrPayloadResult {
  const bytes = utf8ByteLength(payload);

  if (bytes === 0) {
    return fail("Enter content to generate a QR code.");
  }

  if (bytes > MAX_PAYLOAD_BYTES) {
    return fail(
      `Keep the encoded content under ${MAX_PAYLOAD_BYTES} bytes so the QR code stays scannable.`,
    );
  }

  const nextWarnings = [...warnings];

  if (bytes > 800) {
    nextWarnings.push(
      "This payload is large. Smaller QR codes scan more reliably, especially from a phone camera.",
    );
  }

  return { ok: true, payload, warnings: nextWarnings };
}

function buildUrlPayload(fields: QrFields): QrPayloadResult {
  const url = sanitizeHttpUrl(fields.url);

  if (!url) {
    return fail("Enter a valid http or https URL. javascript: and other schemes are not allowed.");
  }

  return succeed(url);
}

function buildTextPayload(fields: QrFields): QrPayloadResult {
  const text = stripControlChars(fields.text).trim();

  if (!text) {
    return fail("Enter the text to encode.");
  }

  if (text.length > MAX_TEXT_CHARS) {
    return fail(`Keep plain text to ${MAX_TEXT_CHARS} characters or fewer.`);
  }

  return succeed(text);
}

function buildEmailPayload(fields: QrFields): QrPayloadResult {
  const email = sanitizeEmail(fields.email);

  if (!email) {
    return fail("Enter a valid email address.");
  }

  const params = new URLSearchParams();
  const subject = stripControlChars(fields.emailSubject).trim();
  const body = stripControlChars(fields.emailBody).trim();

  if (subject) {
    params.set("subject", subject);
  }

  if (body) {
    params.set("body", body);
  }

  const query = params.toString();
  return succeed(query ? `mailto:${email}?${query}` : `mailto:${email}`);
}

function buildPhonePayload(fields: QrFields): QrPayloadResult {
  const phone = sanitizePhone(fields.phone);

  if (!phone) {
    return fail("Enter a valid phone number.");
  }

  return succeed(`tel:${telDigits(phone)}`);
}

function buildSmsPayload(fields: QrFields): QrPayloadResult {
  const phone = sanitizePhone(fields.smsPhone);

  if (!phone) {
    return fail("Enter a valid phone number for the SMS QR code.");
  }

  const digits = telDigits(phone);
  const body = stripControlChars(fields.smsBody).trim();

  if (!body) {
    return succeed(`sms:${digits}`);
  }

  return succeed(`sms:${digits}?body=${encodeURIComponent(body)}`);
}

function buildWifiPayload(fields: QrFields): QrPayloadResult {
  const ssid = stripControlChars(fields.wifiSsid).trim();

  if (!ssid) {
    return fail("Enter the Wi-Fi network name (SSID).");
  }

  if (ssid.length > MAX_SSID_CHARS) {
    return fail(`SSID must be ${MAX_SSID_CHARS} characters or fewer.`);
  }

  if (/[\r\n]/.test(fields.wifiSsid)) {
    return fail("SSID cannot contain line breaks.");
  }

  const auth = isWifiAuth(fields.wifiAuth) ? fields.wifiAuth : "WPA";
  const password = stripControlChars(fields.wifiPassword);
  const parts = [`T:${auth}`, `S:${escapeWifiValue(ssid)}`];

  if (auth === "nopass") {
    if (password.trim()) {
      return fail("Remove the password when the network has no authentication.");
    }
  } else {
    if (!password) {
      return fail("Enter the Wi-Fi password, or choose “No password”.");
    }

    if (password.length > MAX_WIFI_PASSWORD_CHARS) {
      return fail(
        `Wi-Fi passwords must be ${MAX_WIFI_PASSWORD_CHARS} characters or fewer.`,
      );
    }

    if (/[\r\n]/.test(fields.wifiPassword)) {
      return fail("Wi-Fi password cannot contain line breaks.");
    }

    parts.push(`P:${escapeWifiValue(password)}`);
  }

  if (fields.wifiHidden) {
    parts.push("H:true");
  }

  return succeed(`WIFI:${parts.join(";")};;`);
}

function vcardName(fields: QrFields): { family: string; given: string; fn: string } | null {
  const given = trimField(stripControlChars(fields.vcardFirstName));
  const family = trimField(stripControlChars(fields.vcardLastName));
  const fn = [given, family].filter(Boolean).join(" ");

  if (!fn) {
    return null;
  }

  return { family, given, fn };
}

function buildVCardPayload(fields: QrFields): QrPayloadResult {
  const name = vcardName(fields);

  if (!name) {
    return fail("Enter a first name, last name, or both for the vCard.");
  }

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    foldVCardLine(`N:${escapeVCardValue(name.family)};${escapeVCardValue(name.given)};;;`),
    foldVCardLine(`FN:${escapeVCardValue(name.fn)}`),
  ];

  const organization = trimField(stripControlChars(fields.vcardOrganization));
  if (organization) {
    lines.push(foldVCardLine(`ORG:${escapeVCardValue(organization)}`));
  }

  const title = trimField(stripControlChars(fields.vcardTitle));
  if (title) {
    lines.push(foldVCardLine(`TITLE:${escapeVCardValue(title)}`));
  }

  const phone = sanitizePhone(fields.vcardPhone);
  if (fields.vcardPhone.trim() && !phone) {
    return fail("Enter a valid phone number, or leave the vCard phone field empty.");
  }
  if (phone) {
    lines.push(foldVCardLine(`TEL;TYPE=VOICE:${escapeVCardValue(telDigits(phone))}`));
  }

  const email = sanitizeEmail(fields.vcardEmail);
  if (fields.vcardEmail.trim() && !email) {
    return fail("Enter a valid email address, or leave the vCard email field empty.");
  }
  if (email) {
    lines.push(foldVCardLine(`EMAIL;TYPE=INTERNET:${escapeVCardValue(email)}`));
  }

  if (fields.vcardWebsite.trim()) {
    const website = sanitizeHttpUrl(fields.vcardWebsite);
    if (!website) {
      return fail("Enter a valid http or https website, or leave it empty.");
    }
    lines.push(foldVCardLine(`URL:${escapeVCardValue(website)}`));
  }

  const street = trimField(stripControlChars(fields.vcardStreet));
  const city = trimField(stripControlChars(fields.vcardCity));
  const region = trimField(stripControlChars(fields.vcardRegion));
  const postal = trimField(stripControlChars(fields.vcardPostalCode));
  const country = trimField(stripControlChars(fields.vcardCountry));

  if (street || city || region || postal || country) {
    lines.push(
      foldVCardLine(
        `ADR;TYPE=WORK:;;${escapeVCardValue(street)};${escapeVCardValue(city)};${escapeVCardValue(region)};${escapeVCardValue(postal)};${escapeVCardValue(country)}`,
      ),
    );
  }

  lines.push("END:VCARD");
  return succeed(lines.join("\r\n"));
}

export function buildQrPayload(type: QrType | string, fields: QrFields): QrPayloadResult {
  if (!isQrType(type)) {
    return fail("Choose a supported QR type.");
  }

  switch (type) {
    case "url":
      return buildUrlPayload(fields);
    case "text":
      return buildTextPayload(fields);
    case "email":
      return buildEmailPayload(fields);
    case "phone":
      return buildPhonePayload(fields);
    case "sms":
      return buildSmsPayload(fields);
    case "wifi":
      return buildWifiPayload(fields);
    case "vcard":
      return buildVCardPayload(fields);
    default: {
      const exhaustive: never = type;
      return fail(`Unsupported QR type: ${exhaustive}`);
    }
  }
}

export function colorWarnings(foreground: string, background: string): string[] {
  const fg = sanitizeColor(foreground, DEFAULT_FOREGROUND);
  const bg = sanitizeColor(background, DEFAULT_BACKGROUND);
  const warnings: string[] = [];

  if (fg === bg) {
    warnings.push("Foreground and background colors must differ so scanners can read the code.");
  } else if (contrastRatio(fg, bg) < 2) {
    warnings.push(
      "Foreground and background colors are similar. Low contrast QR codes often fail to scan.",
    );
  }

  return warnings;
}
