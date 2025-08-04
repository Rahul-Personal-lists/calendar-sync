import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';

// Extend the session type to include id
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    AzureADProvider({
      clientId: process.env.OUTLOOK_CLIENT_ID!,
      clientSecret: process.env.OUTLOOK_CLIENT_SECRET!,
      tenantId: process.env.AZURE_TENANT_ID || 'common',
      authorization: {
        params: {
          scope: 'openid email profile Calendars.ReadWrite',
        },
      },
    }),
    // TODO: Add Notion provider
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        // Store the account in the database
        const { supabase } = await import('@/lib/supabase');
        
        try {
          console.log('Processing account connection:', {
            user: user.email,
            provider: account.provider,
            hasAccessToken: !!account.access_token
          });

          // Check if this exact connection already exists
          const { data: existingAccount, error: selectError } = await supabase
            .from('connected_accounts')
            .select('id')
            .eq('user_id', user.email!)
            .eq('provider', account.provider)
            .single();

          // If table doesn't exist, log it but don't fail the auth
          if (selectError && (selectError.message.includes('does not exist') || selectError.message.includes('relation'))) {
            console.log('Connected accounts table does not exist yet, skipping token storage');
            console.log('Account connected for user:', user.email, 'provider:', account.provider);
            return token;
          }

          if (existingAccount) {
            // Update existing connection
            const { error } = await supabase
              .from('connected_accounts')
              .update({
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingAccount.id);

            if (error) {
              console.error('Error updating account:', error);
            } else {
              console.log('Updated account for user:', user.email, 'provider:', account.provider);
            }
          } else {
            // Create new connection
            const { error } = await supabase
              .from('connected_accounts')
              .insert({
                user_id: user.email!,
                provider: account.provider,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
              });

            if (error) {
              console.error('Error creating account:', error);
            } else {
              console.log('Created new account for user:', user.email, 'provider:', account.provider);
            }
          }
        } catch (error) {
          console.error('Error in JWT callback:', error);
        }

        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}; 