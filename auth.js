import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { generateFromEmail, generateUsername } from "unique-username-generator";
import { db } from "./src/prisma/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      const UserWithSameEmail = await db.orm.public.Account.select(
        "id",
        "email",
      ).first({
        email: user.email,
      });

      if (UserWithSameEmail) {
        console.info(`User with email: ${user.email} Detected`);
        user.userId = UserWithSameEmail.id;
        return true;
      }

      const username = generateUsername();
      const provider = account.provider.toUpperCase();

      console.info(
        `New user created with: email - ${user.email}, username - ${username}, provider - ${provider}`,
      );
      const NewlyCreatedUser = await db.orm.public.Account.create({
        email: user.email,
        username: username,
        provider: provider,
      });
      user.userId = NewlyCreatedUser.id;

      return true;
    },
    async jwt({ token, user }) {
      if (user) token.userId = user.userId;

      return token;
    },
    async session({ session, token }) {
      // Attach user ID to session for use in your app
      if (token.userId) {
        session.user.userId = token.userId;
      }
      return session;
    },
  },
});
