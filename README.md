# 🏟️ PlaySphere AI

### Agentic AI Sports Infrastructure Discovery & Booking Platform

---

> [!IMPORTANT]
> **🚀 Generated via Antigravity**  
> This project was fully generated, debugged, and optimized using **Antigravity** (Google DeepMind's agentic AI coding assistant) for the **AI Day for Startups India 2026** event held at **IIM Lucknow** by **Team Deepstack**.

---

## 🎯 Overview
**PlaySphere AI** is a modern, full-stack web application designed to help sports enthusiasts in Lucknow discover, compare, and book sports venues (badminton courts, football turfs, swimming pools, etc.) using natural language and interactive maps. 

Powered by agentic AI, the platform acts as an intelligent sports copilot, understanding complex user requests, matching them against available sports facilities, and guiding them through the booking pipeline.

---

## 🛠️ Tech Stack
* **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
* **Frontend UI**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Database & Auth**: [Firebase Firestore](https://firebase.google.com/docs/firestore) & [Firebase Auth](https://firebase.google.com/docs/auth)
* **AI Engine**: Llama 3.1-8b-instant (via Groq/OpenAI compatible endpoint)
* **Map Services**: [Google Maps API](https://developers.google.com/maps)
* **Testing**: [Playwright](https://playwright.dev/)

---

## ✨ Features

### 🏃 For Athletes (Players)
* **AI Sports Concierge**: Interactive chatbot parsing natural language queries (e.g., *"Find beginner badminton courts near Gomti Nagar under ₹300"*) to find matching facilities and pre-fill booking details.
* **Interactive Sports Map**: Pinned venues, government infrastructure, and landmark indicators powered by Google Maps with density/proximity analysis.
* **Smart Booking Engine**: Live slot selection, real-time availability checks, and conflicts prevention.
* **Player Dashboard**: Track upcoming bookings, past history, and manage bookmarked/saved venues.

### 🏢 For Venue Owners & Admins
* **Infrastructure Mapping**: Claim and link mapped city sports infrastructure.
* **Ownership Verification**: Admins verify and approve ownership requests before listings go live on the marketplace.
* **Accredited Dashboards**: Specialized views to manage courts, timings, and verify bookings.

### 🔄 Zero-Dependency Demo Mode
* **Graceful Mock Fallback**: If Firebase environment variables are missing, the app automatically switches to **Mock UI Mode** using local storage to emulate user registration, Google Sign-in, role-based dashboards, and booking simulation.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher)
* **NPM** (v9 or higher)

### Setup & Run Locally

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Shivam5802/PlaySphereAI.git
   cd PlaySphereAI
   ```

2. **Configure Environment Variables**
   Create a `.env.local` file inside the root directory and add your keys:
   ```env
   # Firebase Web Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # Admin Emails Whitelist (comma separated)
   NEXT_PUBLIC_ADMIN_EMAILS=admin@playsphere.in
   
   # Google Maps Key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
   
   # AI Agent LLM API Config
   LLM_API_KEY=your_groq_api_key
   LLM_API_URL=https://api.groq.com/openai/v1
   LLM_MODEL=llama-3.1-8b-instant
   ```
   > 💡 *Note: If no env keys are provided, the app will run locally in Mock UI Mode.*

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📦 Deployment on Vercel

The application is fully configured for deployment on **Vercel** via a root-level [vercel.json](file:///c:/Users/sjais/Downloads/PlaySphereai/PlaySphere-main/vercel.json) configuration:

1. Import your repository into Vercel.
2. In the Vercel dashboard, add all the environment variables from your `.env.local` to **Settings > Environment Variables**.
3. Under **Authentication > Settings > Authorized Domains** in the Firebase Console, add your Vercel deployment URL (e.g., `playsphere-ai.vercel.app`).
4. Trigger a deploy!

---

## 👥 Team & Hackathon Context
This project was developed by **Team Deepstack** for **AI Day for Startups India 2026** at **IIM Lucknow**.
* **Primary Developer / Pair Programmer**: Shivam Jaiswal & Antigravity (AI Agent)