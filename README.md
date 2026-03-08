# Lead Factory Dashboard

Lead Factory Dashboard is a next-generation AI-powered sales automation and unified multi-channel outreach platform. Built to act as an autonomous top-tier sales representative, the platform manages end-to-end B2B sales cycles—from intelligent lead sourcing and automated outreach sequencing to AI-assisted objection handling and meeting booking.

## 🚀 Key Features and Capabilities

### Products & AI Sales Strategy
The foundation of any outreach is the **Product**. Users define their target customers, pain points, and value propositions. 
- **AI Strategy Generation**: Once a product is defined, the system's AI Brain automatically writes a full **Sales Strategy**, detailing the target audience, key value messages, recommended outreach approach, and follow-up strategy. 

### The Setup Wizard Flow
When launching a new campaign, the dashboard guides users through a comprehensive 7-step Setup Wizard to ensure everything is configured for maximum conversion:

1. **Pipeline Stages**: Define the visual Kanban stages for this specific campaign (e.g., Prospecting, Negotiating, Closed-Won).
2. **AI Sales Strategy**: Review and refine the AI-generated strategy specific to this product.
3. **Import Contacts**: Source leads manually, import via CSV, or connect to the integrated LinkedIn Scraper to pull verified profiles directly into the campaign.
4. **Email Settings**: Configure the sender name, email account, and tracking domains (using Mailgun/AWS SES).
5. **Google Calendar**: Connect a calendar so the AI can automatically propose available times and book meetings without human intervention.
6. **AI Auto-Reply**: Train the AI on how to handle objections, frequently asked questions (FAQs), and positive responses.
7. **Connect LinkedIn**: Link the user's professional LinkedIn account via the Unipile API for automated profile visits, connection requests, and DMs.

### Intelligent Campaign Sequence Builder
Design, automate, and monitor sophisticated multi-touch outreach sequences.
- **Visual Flow Editor**: Build step-by-step outreach workflows containing:
  - **Emails**: Initial outreach, follow-ups, and breakup emails.
  - **LinkedIn Actions**: View profile, send connection invite, send direct message.
  - **Conditions**: Logic-based branching (e.g., "Accepted invite within 5 days? -> Send DM, Else -> Send Email").
- **Smart Delays**: Set logic-based waiting periods between nodes to space out touches naturally.
- **AI Copywriting generation**: The AI pre-writes your step-by-step messaging sequence based on the product's strategy and tone.

### Multi-Channel Unified Inbox
A single pane of glass for all your professional communications.
- **Provider Integrations**: Natively connects with major communication providers via Unipile APIs (Email, LinkedIn, WhatsApp, Telegram).
- **AI Classification**: Automatically categorizes incoming messages (e.g., meeting requests, objections, support questions).
- **Auto-Reply Suggestions**: Suggests context-aware, hyper-personalized replies based on the AI Auto-Reply training and conversation history.

### Insights & Analytics
- **Campaign Dashboard**: Real-time stats showing Total Sent, Opens, Clicks, Replies, and Demos Booked.
- **Lead Sourcing & Management**: Integrated tools for filtering, enriching, and tracking leads directly within the dashboard.

---

## 🛠️ Technology Stack

- **Frontend Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with Radix UI primitives and Lucide React icons.
- **Authentication & Database**: [Supabase](https://supabase.com/) & SQLite (Local data storage)
- **Email Infrastructure**: AWS SES & [Mailgun](https://www.mailgun.com/) via Nodemailer / Sendgrid SDKs.
- **Multi-Channel API**: [Unipile](https://www.unipile.com/)
- **Web Scraping & Automation**: [Airtop](https://airtop.ai/) & [Apify](https://apify.com/)
- **AI Models**: Anthropic Claude & OpenAI

---

## 💻 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mrdeev/leadfactory.git
   cd leadfactory
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Duplicate the `.env.example` file (if available) to `.env` and fill in necessary API keys:
   ```env
   # LLM Providers
   ANTHROPIC_API_KEY=your_anthropic_key
   OPENAI_API_KEY=your_openai_key

   # Database / Auth (Supabase)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Email Providers
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   
   # Multi-Channel connection
   UNIPILE_API_KEY=your_unipile_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

- `src/app/` - Next.js App Router housing all pages and API routes.
  - `(auth)/` - Login/Signup logic.
  - `api/` - Backend endpoints for webhooks, email sending, AI logic, and scraping.
  - `dashboard/` - The core application interface (campaigns, inbox, channels).
- `src/components/` - Reusable UI components (layouts, forms, wizards, tables).
- `src/lib/` - Server-side utility functions, AI orchestration agents, database clients.
- `src/data/` - Mock databases (JSON files) and uploaded AI context documents representing the "Brain".
- `src/hooks/` - Custom React hooks for global state and auth management.

---

## 🛡️ License & Legal
*Proprietary software. Unauthorized copying, distribution, or usage is strictly prohibited.*
