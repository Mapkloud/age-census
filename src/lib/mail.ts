export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type SendEmailResult =
  | { ok: true; via: "resend" | "console" }
  | { ok: false; error: string };

function resendApiKey(): string | undefined {
  return process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY || undefined;
}

export function isResendConfigured(): boolean {
  return Boolean(resendApiKey());
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "Age Census <noreply@localhost>";
}

/**
 * Deliver transactional mail. Uses Resend when a key is set; otherwise logs
 * to the server console (local / unconfigured).
 */
export async function sendEmail(message: OutboundEmail): Promise<SendEmailResult> {
  const key = resendApiKey();
  if (!key) {
    console.log(
      `\n[age-census] Email to ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`,
    );
    return { ok: true, via: "console" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return {
      ok: false,
      error: `Resend ${response.status}${detail ? `: ${detail}` : ""}`,
    };
  }

  return { ok: true, via: "resend" };
}
