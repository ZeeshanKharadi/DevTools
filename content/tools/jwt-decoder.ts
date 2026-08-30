import type { ToolContent } from "./types";

export const jwtDecoderContent: ToolContent = {
  privacy: "Processed locally — your token never leaves your browser.",
  howTo: [
    {
      title: "Paste a JWT",
      body: "Put the token in the input. A leading Bearer prefix is ignored. Decoding happens in your browser.",
    },
    {
      title: "Decode the header and payload",
      body: "Choose Decode or press Ctrl+Enter / Cmd+Enter. The JWT decoder shows the header, payload, and common time claims.",
    },
    {
      title: "Read the warning",
      body: "Decoding is not verification. This tool does not check the signature. Anyone can read an unsigned or unauthenticated JWT payload.",
    },
  ],
  examples: [
    {
      title: "Read claims",
      body: "A typical JWT payload includes sub, name, iat, and exp. iat and exp are shown as local time and UTC.",
    },
    {
      title: "Bearer token",
      body: "You can paste Authorization: Bearer <token> style values. The prefix is stripped before decode.",
    },
  ],
  faq: [
    {
      question: "Does decoding a JWT verify it?",
      answer:
        "No. This JWT decoder only base64url-decodes the header and payload. It does not verify the signature and must not be used as authentication.",
    },
    {
      question: "Is my token sent to a server?",
      answer:
        "No. The token stays in your browser. Do not paste production secrets into untrusted devices, but this site does not upload the JWT.",
    },
    {
      question: "Why can I read the payload without a secret?",
      answer:
        "JWT header and payload are encoded, not encrypted. The signature is what proves integrity. This page never checks that signature.",
    },
  ],
};
