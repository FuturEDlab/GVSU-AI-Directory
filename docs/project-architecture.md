# LakerAI Directory - Project Architecture

This document provides a simple overview of the LakerAI Directory project, how its pieces fit together, and where to find the important files.

## 1. FRONTEND
The frontend is built with **Next.js (App Router)** and **React 19**. It uses **Tailwind CSS** for styling and **shadcn/ui** (Radix UI) for components.

*   **Pages & Routing:** Located in `src/app/`. Each folder (like `src/app/dashboard`, `src/app/admin-portal`) represents a route, and the `page.tsx` inside it is the UI for that page.
*   **Global Styles:** Located in `src/app/globals.css`.

## 2. BACKEND
Since this uses Next.js, the backend API logic runs on the same server as the frontend.

*   **API Routes:** Located in `src/app/api/`. For example, `src/app/api/cron/news/route.ts` runs a scheduled job to fetch news.
*   **Server Actions/Data Fetching:** Much of the backend logic is handled natively in React Server Components within the `src/app` directory or utilizing Firebase directly.

## 3. AI
The project uses **Google Genkit** (`@genkit-ai/google-genai`) and Gemini models to power its AI features.

*   **AI Flows:** Located in `src/ai/flows/`. This includes files like `tool-discovery.ts` (matching tools), `support-assistant.ts` (chatbot logic), and `fetch-global-news.ts`.
*   **Configuration:** The Genkit initialization happens in `src/ai/genkit.ts`.

## 4. DATABASE
The database is **Firebase Firestore**, a NoSQL cloud database.

*   **Configuration:** Firebase is initialized in `src/firebase/config.ts`.
*   **Hooks & Providers:** Firebase connection and context are handled in `src/firebase/provider.tsx`, `src/firebase/client-provider.tsx`, and `src/firebase/firestore/`.

## 5. AUTHENTICATION
User authentication is managed by **Firebase Authentication**.

*   **Logic & UI:** The auth logic lives in `src/firebase/auth/`. There are also non-blocking login components like `src/firebase/non-blocking-login.tsx` to handle user sign-in seamlessly.
*   **Protected Areas:** Pages check the user's authentication state (and admin status) before granting access, typically utilizing React context or server-side checks.

## 6. COMPONENTS
The project uses a component-based architecture with reusable React components.

*   **Main Components:** Located in `src/components/` (e.g., `GVSUHeader.tsx`, `LakerAIAssistant.tsx`, `ToolCard.tsx`).
*   **UI Library:** The `src/components/ui/` folder contains standard reusable UI elements (like buttons, dialogs, form inputs) mostly built with shadcn/ui.
*   **Feature Components:** Specific features have their own folders, like `src/components/admin/`, `src/components/news/`, and `src/components/help/`.

## 7. ADMIN PORTAL
The Admin Portal allows authorized users to manage the system.

*   **Pages:** Located in `src/app/admin-portal/`.
*   **Components:** Located in `src/components/admin/` (e.g., `governance/`, `ticketing/`).
*   **Permissions:** Only specific whitelisted emails are granted admin privileges (defined in project rules and checked via Firebase).

## 8. PROMPT LIBRARY
The Prompt Library is a feature for managing and sharing AI prompts.

*   **Pages:** Located in `src/app/prompt-library/`.
*   **Components:** Located in `src/components/prompt-library/`.

## 9. NEWS
The platform fetches and displays relevant news.

*   **Backend Fetching:** Handled by a cron job API route (`src/app/api/cron/news/route.ts`) and a Genkit AI flow (`src/ai/flows/fetch-global-news.ts`).
*   **UI Components:** Located in `src/components/news/`.

## 10. CHATBOT / LAKERAI ASSISTANT
The LakerAI Assistant helps users discover AI tools.

1.  **User Input:** The user types a request into `src/components/LakerAIAssistant.tsx`.
2.  **Processing:** The request is sent to the AI flow (`src/ai/flows/tool-discovery.ts` or `support-assistant.ts`).
3.  **Matching & Ranking:** The AI uses Gemini to analyze the request, match it against the database of tools, calculate match percentages, and rank the best results.
4.  **Display:** The frontend displays the recommended tools to the user.

## 11. SECURITY
Security is enforced at multiple levels.

*   **Firestore Rules:** Located in `src/firebase/firestore.rules`. These rules strictly control who can read or write data in the database based on their authentication status and roles.
*   **Authentication:** Firebase Auth ensures only valid users can access protected features.

## 12. DEPLOYMENT
The application is designed to be deployed using **Firebase App Hosting**.

*   **Configuration:** The deployment settings are defined in `apphosting.yaml` and `firebase.json`.
*   **Local Development:** Run `npm run dev` to start the Next.js server locally on port 9002.

## 13. SIMPLE PROJECT FLOW

Here is how the entire application works in one simple flow:

**User** → **Frontend** → **Next.js** → **Firebase / AI** → **Response** → **Frontend**

---

## HOW I CAN EXPLAIN THIS PROJECT IN AN INTERVIEW

"The LakerAI Directory is a full-stack web application built with a Next.js frontend using React and Tailwind CSS for a responsive, modern UI. The backend logic is seamlessly handled by Next.js API routes and server actions, which communicate with a Firebase Firestore database to store application data. For its core features, it integrates Google Genkit and Gemini AI models to power intelligent search, a support chatbot, and tool recommendations. User access and security are managed securely via Firebase Authentication, ensuring that general users can access the directory while authorized staff can securely manage the platform through a dedicated Admin Portal."
