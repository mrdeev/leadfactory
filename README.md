# Lead Factory Dashboard

Lead Factory Dashboard is a next-generation AI-powered sales automation and unified multi-channel outreach platform. Built to act as an autonomous top-tier sales representative, the platform manages end-to-end B2B sales cycles—from intelligent lead sourcing and automated outreach sequencing to AI-assisted objection handling and meeting booking.

## 🚀 Key Features and Capabilities

### 1. Intelligent Campaign Sequence Builder
Design, automate, and monitor sophisticated multi-touch outreach sequences.
- **Visual Flow Editor**: Build step-by-step outreach workflows combining emails, LinkedIn visits, connection requests, and direct messages.
- **Smart Delays & Conditions**: Set logic-based waiting periods (e.g., "Wait 5 days for invite acceptance, otherwise send follow-up Email 2").
- **Adaptive Strategy Generation**: The AI analyzes your product's target audience, pain points, and value proposition to dynamically generate customized campaign strategies.
- **Anti-Spam & Deliverability Guardians**: Multi-layered algorithms mimic human variation and respect platform rate limits to maximize deliverability. 

### 2. Multi-Channel Unified Inbox
A single pane of glass for all your professional communications.
- **Provider Integrations**: Natively connects with major communication providers, including:
  - Email (Gmail, Outlook)
  - Social & Messaging (LinkedIn, WhatsApp, Telegram, Instagram)
- **AI Classification**: Automatically categorizes incoming messages (e.g., meeting requests, objections, support questions).
- **Auto-Reply Suggestions**: Suggests context-aware, hyper-personalized replies based on past conversation history and product knowledge.

### 3. Lead Sourcing & Management
Smarter targeting for higher conversion rates.
- **LinkedIn Intelligent Scraping**: Scrape verified leads directly from LinkedIn using advanced filters and integrate them seamlessly into your campaigns.
- **Contact Management**: Centralized repository for all contacts with rich data enrichment.
- **Pipeline Stages**: Visual Kanban-style tracking of where each lead is within the sales cycle (Prospecting, Negotiating, Closed-Won, etc.).
- **Bulk Imports**: Easily upload CSVs to feed new leads into active automated sequences.

### 4. Meetings & Calendar Conversions
Streamlined scheduling and follow-ups.
- **Google Calendar Integration**: Direct syncing of your calendar.
- **Meeting Tracking**: Real-time insights into booked demos, upcoming calls, and no-shows directly within the dashboard.

### 5. Advanced 'AI Brain' Engine
The core intelligence driving the Lead Factory platform.
- **Continuous Learning**: Employs an objection-handling engine and conversational psychology models to learn from rejections and refine future outreach.
- **Lead Scoring**: Assigns dynamic scores to prospects based on engagement "silent signals" (e.g., email opens, profile visits).
- **Grok & Claude Powered**: Leverages state-of-the-art LLMs under the hood for human-like copywriting and strategic reasoning.

---

## 🛠️ Technology Stack

- **Frontend Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with Radix UI primitives and Lucide React icons.
- **Authentication & Database**: [Supabase](https://supabase.com/) & SQLite (Local testing)
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
