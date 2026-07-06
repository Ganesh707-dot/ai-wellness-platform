import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

export const config = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        try {
          const parsed = loginSchema.parse({
            email: credentials.email,
            password: credentials.password,
          });

          const user = await db.user.findUnique({
            where: { email: parsed.email },
            include: {
              patientProfile: true,
              doctorProfile: true,
            },
          });

          if (!user || !user.password) {
            throw new Error("User not found");
          }

          const passwordMatch = await compare(parsed.password, user.password);

          if (!passwordMatch) {
            throw new Error("Invalid password");
          }

          if (!user.isActive) {
            throw new Error("Account is disabled");
          }

          // Update last login
          await db.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-in
      if (account?.provider === "github" || account?.provider === "google") {
        const existingUser = await db.user.findUnique({
          where: { email: user.email || "" },
        });

        if (!existingUser) {
          // Create new user from OAuth profile
          await db.user.create({
            data: {
              email: user.email || "",
              name: user.name || "User",
              image: user.image,
              role: "PATIENT", // Default new OAuth users to PATIENT
              password: null, // No password for OAuth users
            },
          });
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.email = user.email;
      }

      if (account) {
        token.provider = account.provider;
      }

      // Refresh user data on each JWT callback
      const dbUser = await db.user.findUnique({
        where: { id: token.id as string },
      });

      if (dbUser) {
        token.role = dbUser.role;
        token.isActive = dbUser.isActive;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).isActive = token.isActive;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect based on user role
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signOut({ token }) {
      // Log sign out
      console.log("User signed out:", token.email);
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
