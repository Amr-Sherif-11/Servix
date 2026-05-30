import NextAuth from 'next-auth';
import FacebookProvider from 'next-auth/providers/facebook';
import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import { createClient } from '@/lib/supabase/client';
import type { User, Account, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

const supabase = createClient();

const authOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID ?? '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? '',
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  }),
  callbacks: {
    async signIn({ user, account, profile }: {
      user: User;
      account: Account | null;
      profile?: any;
    }) {
      const profileRow = {
        id: user.id,
        email: user.email,
        first_name: profile?.first_name ?? '',
        last_name: profile?.last_name ?? '',
      };
      const { error } = await supabase.from('profiles').upsert([profileRow] as any);
      if (error) console.error('Supabase profile upsert error:', error);
      return true;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };