import { appBaseUrl } from "@/lib/app-url";

export type ComposedEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  ctaUrl: string;
};

export function absoluteUrl(path: string, baseUrl = appBaseUrl()): string {
  const base = baseUrl.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** Shared Age Census transactional HTML shell. */
export function wrapTransactionalHtml(args: {
  eyebrow?: string;
  title: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaUrl: string;
  footnote?: string;
}): string {
  const body = args.paragraphs
    .map(
      (p, i) =>
        `<p style="margin:0 0 ${i === args.paragraphs.length - 1 ? "28" : "16"}px;font-size:17px;line-height:1.55;color:#3d3428;">${p}</p>`,
    )
    .join("\n");
  const footnote = args.footnote
    ? `<p style="margin:0 0 28px;font-size:15px;line-height:1.5;color:#8a7a64;">${args.footnote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f6f1e8;color:#2a241c;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fffaf2;border:1px solid #e4d8c4;border-radius:4px;padding:36px 32px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8a7a64;font-family:Helvetica,Arial,sans-serif;">${args.eyebrow ?? "Age Census"}</p>
              <h1 style="margin:0 0 16px;font-size:28px;line-height:1.25;font-weight:normal;color:#2a241c;">${args.title}</h1>
              ${body}
              ${footnote}
              <a href="${args.ctaUrl}" style="display:inline-block;background:#c45c3e;color:#fffaf2;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:15px;padding:12px 22px;border-radius:4px;">${args.ctaLabel}</a>
              <p style="margin:28px 0 0;font-size:13px;line-height:1.45;color:#8a7a64;font-family:Helvetica,Arial,sans-serif;">If the button doesn’t work, use this link:<br/><a href="${args.ctaUrl}" style="color:#8a4a32;word-break:break-all;">${args.ctaUrl}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
