export { EmailDeliveryError, type EmailMessage, type EmailSender } from "./types";
export { createConsoleEmailSender } from "./console";
export { createResendEmailSender } from "./resend";
export { createUnconfiguredEmailSender } from "./unconfigured";
export { createEmailSenderFromEnv, type EmailEnv } from "./from-env";
export { RecordingEmailSender } from "./recording";
export {
  parsePasswordResetUrl,
  parseVerificationCode,
  passwordResetConfirmationEmail,
  passwordResetEmail,
  verificationEmail,
} from "./templates";
