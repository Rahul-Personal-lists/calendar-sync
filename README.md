# Calendar Sync - Unified Calendar Management

A Progressive Web App (PWA) that syncs and manages your Google, Outlook, and Notion calendars with voice-based event creation.

## 🚀 Features

- **Unified Calendar View**: See all your events from different providers in one place
- **Voice Event Creation**: Add events by speaking natural language like "Bank appointment at 10am on Wednesday"
- **Manual Event Creation**: Create events with a traditional form interface
- **Multi-Provider Sync**: Google Calendar, Outlook, and Notion integration
- **Progressive Web App**: Installable on any device with offline support
- **Real-time Sync**: Keep your calendars up to date automatically
- **Mobile-First Design**: Responsive interface that works on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: NextAuth.js with Google, Outlook, and Notion providers
- **State Management**: React Query for server state, Zustand for client state
- **PWA**: next-pwa for offline support and installability
- **Voice Input**: Web Speech API for voice-to-text conversion

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd calendar-sync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   - Supabase credentials
   - NextAuth configuration
   - OAuth provider credentials (Google, Outlook, Notion)
4. **Set up Google OAuth (Required for Calendar Sync)**

   ### Step 1: Create Google Cloud Project
   1. Go to [Google Cloud Console](https://console.cloud.google.com/)
   2. Create a new project or select existing one
   3. Enable the Google Calendar API:
      - Go to **APIs & Services** > **Library**
      - Search for "Google Calendar API"
      - Click on it and press **Enable**

   ### Step 2: Configure OAuth Consent Screen
   1. Go to **APIs & Services** > **OAuth consent screen**
   2. Choose **External** user type (unless you have Google Workspace)
   3. Fill in required information:
      - **App name**: "Calendar Sync"
      - **User support email**: Your email
      - **Developer contact information**: Your email
   4. Add scopes:
      - `https://www.googleapis.com/auth/calendar`
      - `https://www.googleapis.com/auth/calendar.events`
      - `https://www.googleapis.com/auth/userinfo.email`
      - `https://www.googleapis.com/auth/userinfo.profile`
   5. Add test users (your email address)
   6. Save and continue

   ### Step 3: Create OAuth Credentials
   1. Go to **APIs & Services** > **Credentials**
   2. Click **Create Credentials** > **OAuth client ID**
   3. Choose **Web application**
   4. Add authorized JavaScript origins:
      - `http://localhost:3000`
   5. Add authorized redirect URIs:
      - `http://localhost:3000/api/auth/callback/google`
   6. Copy the **Client ID** and **Client Secret** to your `.env.local`

   ### Step 4: Update Environment Variables
   ```bash
   # In .env.local
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

    To Enable Outlook, Follow This Guide:
Step-by-Step Azure AD Setup
1. Create Azure App Registration
Go to Azure Portal
Search for "App registrations" and click it
Click "New registration"
Fill in:
Name: Calendar Sync App
Supported account types: Accounts in any organizational directory and personal Microsoft accounts
Redirect URI: http://localhost:3001/api/auth/callback/azure-ad
Click "Register"
2. Get Your Credentials
From the app overview page, copy the Application (client) ID (this is a GUID)
Go to "Certificates & secrets" in the left menu
Click "New client secret"
Add a description like "Calendar Sync Secret"
Choose expiration (24 months recommended)
Copy the Value (this is your client secret)
3. Configure API Permissions
Go to "API permissions" in the left menu
Click "Add a permission"
Select "Microsoft Graph"
Choose "Delegated permissions"
Search for and add these permissions:
Calendars.ReadWrite
User.Read
email
openid
profile
Click "Grant admin consent" (if you're an admin)
4. Update Your Environment Variables
Edit your .env.local file:
your
5. Re-enable Outlook
Once you have the real credentials, uncomment these sections:
In src/lib/auth.ts:
common
In src/app/auth/signin/page.tsx:




   **Note**: For development, the app currently uses basic OAuth scopes. To enable calendar access, uncomment the calendar scopes in `src/lib/auth.ts` after setting up the consent screen properly.

   https://console.cloud.google.com/auth/scopes?inv=1&invt=Ab4a_g&project=calendar-nextjs-467817

5. **Set up Supabase database**
   
   Create the following tables in your Supabase project:

   ```sql
   -- Users table (handled by NextAuth)
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email TEXT UNIQUE NOT NULL,
     name TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Connected accounts table
   CREATE TABLE connected_accounts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     provider TEXT NOT NULL,
     access_token TEXT NOT NULL,
     refresh_token TEXT,
     expires_at BIGINT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_id, provider)
   );

   -- Events table
   CREATE TABLE events (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     provider TEXT NOT NULL,
     title TEXT NOT NULL,
     description TEXT,
     start TIMESTAMP WITH TIME ZONE NOT NULL,
     end TIMESTAMP WITH TIME ZONE NOT NULL,
     location TEXT,
     notion_page_id TEXT,
     google_event_id TEXT,
     outlook_event_id TEXT,
     apple_event_id TEXT,
     color TEXT,
     is_all_day BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_id, google_event_id),
     UNIQUE(user_id, outlook_event_id),
     UNIQUE(user_id, notion_page_id)
   );

   -- Sync logs table
   CREATE TABLE sync_logs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     provider TEXT NOT NULL,
     status TEXT NOT NULL,
     events_synced INTEGER,
     error_message TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to your `.env.local`

### Supabase Setup

1. Create a new project at [Supabase](https://supabase.com/)
2. Get your project URL and anon key
3. Create the database tables (see installation step 4)
4. Set up Row Level Security (RLS) policies for data protection

## 📱 PWA Features

The app is installable as a Progressive Web App:

- **Offline Support**: Basic functionality works without internet
- **Installable**: Add to home screen on mobile and desktop
- **Native Feel**: Full-screen experience with custom icons
- **Push Notifications**: (Coming soon) Get notified about upcoming events

## 🎤 Voice Input

The voice input feature uses the Web Speech API:

- **Supported Browsers**: Chrome, Safari (limited), Edge
- **Natural Language**: Speak events in natural language
- **Smart Parsing**: Automatically extracts title, time, date, and location
- **Examples**:
  - "Team meeting at 2pm tomorrow"
  - "Doctor appointment on Friday at 10am"
  - "Lunch with John at the restaurant at noon"

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard page
│   ├── settings/          # Settings page
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── CalendarView.tsx   # Calendar display component
│   ├── VoiceInput.tsx     # Voice input modal
│   └── QueryProvider.tsx  # React Query provider
├── services/              # External service integrations
│   └── sync/              # Calendar sync services
├── lib/                   # Utility libraries
│   ├── supabase.ts        # Supabase client
│   └── auth.ts            # NextAuth configuration
├── types/                 # TypeScript type definitions
└── styles/                # Global styles
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/your-repo/calendar-sync/issues) page
2. Create a new issue with detailed information
3. Include browser console logs and error messages

## 🔮 Roadmap

- [ ] Outlook Calendar integration
- [ ] Notion database integration
- [ ] Apple Calendar support
- [ ] Push notifications
- [ ] Event conflict resolution
- [ ] Smart scheduling suggestions
- [ ] Calendar sharing
- [ ] Recurring events support
- [ ] Time zone handling
- [ ] Multi-language support

---

Built with ❤️ using Next.js, Supabase, and modern web technologies.