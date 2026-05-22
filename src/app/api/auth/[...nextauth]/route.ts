import NextAuth from 'next-auth';
import FacebookProvider from 'next-auth/providers/facebook';
import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import { createClient } from '@/lib/supabase/client';
import type { User, Account, Profile, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

const supabase = createClient();

export const authOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID ?? '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? '',
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    secret: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  }),
  callbacks: {
    async signIn({
    user,
    account,
    profile,
}: {
  user: User;
  account: Account | null;
  profile?: any; // Facebook profile fields are not covered by next-auth's Profile type
}) {
      // Store extra profile info in Supabase 'profiles' table
        // Define the shape of a profile row for Supabase
        type ProfileRow = {
          id: string;
          email: string | null;
          first_name?: string;
          last_name?: string;
          phone_number?: string;
        };

        const profileRow = {
          id: user.id,
          email: user.email,
          first_name: profile?.first_name ?? '',
          last_name: profile?.last_name ?? '',
          // Facebook does not provide phone; you may set later
        };
        const { data, error } = await supabase.from('profiles').upsert([profileRow] as any);
      if (error) console.error('Supabase profile upsert error:', error);
      return true;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
       // Attach user id to session (extend session with custom id)
       if (token.sub) {
         // Cast to any to allow custom field
         (session.user as any).id = token.sub;
       }
       return session;
     },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const GET = NextAuth(authOptions);
export const POST = NextAuth(authOptions);
