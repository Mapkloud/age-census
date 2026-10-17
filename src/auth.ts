import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { emailFrom, sendEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { composeMagicLinkEmail } from "@/modules/auth/magic-link-email";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    Resend({
      from: emailFrom(),
      sendVerificationRequest: async ({ identifier, url }) => {
        const content = composeMagicLinkEmail({ email: identifier, url });
        const result = await sendEmail({
          to: content.to,
          subject: content.subject,
          text: content.text,
          html: content.html,
        });
        if (!result.ok) {
          throw new Error(result.error);
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
