# ⚡ LakerAI Directory

### GVSU AI Exchange — AI Tool Discovery, Governance, Education & Community Platform

The **LakerAI Directory** is an AI discovery and governance platform designed to help the Grand Valley State University community discover, evaluate, understand, and share AI-powered tools and resources. The platform combines an AI-powered tool directory, intelligent search, educational AI resources, global AI news, community prompts, user feedback, reporting, support, and an administrative governance system into a single web application.

The platform is designed around a simple idea: users should be able to discover useful AI tools without needing to search across dozens of websites, while governance administrators should have the ability to review submitted tools, monitor community activity, evaluate AI-related content, and maintain the quality of the directory.

> **Important:** The LakerAI Directory is a community discovery tool and does not represent official University endorsement. Always consult IT and Legal services for formal sanctioned software procurement.

---

# 🎯 Project Overview

LakerAI Directory provides a centralized environment where students, faculty, staff, and other members of the GVSU community can explore AI tools and AI-related resources.

Instead of presenting the directory as a simple list of links, the platform organizes tools according to their purpose, capabilities, categories, specifications, educational value, and community information.

The platform also incorporates AI-assisted discovery through **LakerAI Assistant**, allowing users to describe what they are trying to accomplish in natural language and receive relevant tool recommendations.

The system includes both a **user-facing platform** and an **AI Governance Hub** for administrators.

---

# 🧭 What the Front-End Platform Does

The front-end LakerAI Directory is the primary experience for users looking for AI tools and educational AI resources.

Users can browse the AI tool directory, search for tools, filter tools by category, open individual tool detail pages, review tool capabilities and specifications, and learn about how different AI products can be used.

The directory is intended to make AI discovery easier for users who may not know the name of a specific AI product. Instead of requiring users to search for a product directly, they can search by the problem they are trying to solve.

For example, a user can look for tools for writing, research, coding, presentations, image generation, productivity, education, data analysis, or other supported use cases.

---

# 🔎 AI Tool Discovery

The main directory provides a searchable collection of published AI tools.

Users can:

- Search for AI tools.
- Browse available AI tools.
- Filter tools by category.
- Open detailed tool pages.
- Review tool descriptions.
- Review tool specifications.
- Review supported capabilities.
- View associated categories and tags.
- View community information where available.
- Discover educational and productivity use cases.
- Submit tools for community review.
- Report problematic or inappropriate content.

The goal is to make AI discovery practical rather than simply providing a large collection of external links.

---

# 🤖 LakerAI Assistant

LakerAI Assistant provides an AI-powered conversational interface for discovering tools.

Instead of requiring a user to know the exact name of an AI product, users can describe what they need in natural language.

For example:

> "I need an AI tool that can help me summarize research papers."

or:

> "I need something for creating presentations."

The assistant analyzes the request and identifies potentially relevant tools from the published directory.

The assistant is integrated into the main platform experience rather than being presented as a separate popup-only experience.

---

# ⚡ LakerAI Retrieval Specifications

LakerAI uses a two-stage retrieval and ranking architecture.

First, the server retrieves a limited set of potentially relevant tools using deterministic token-based scoring. The current scoring system gives higher importance to fields that are more directly useful for tool discovery:

- **Tool Name:** 10 points
- **Tags:** 6 points
- **Category:** 5 points
- **Description:** 2 points

The system then sends a constrained candidate set to Gemini for AI-assisted reranking.

The retrieval process is intentionally designed to avoid sending the entire tool catalog to the client or unnecessarily sending the complete catalog to the language model.

Current retrieval limits include:

- Maximum of 20 candidates sent to Gemini.
- At least 8 candidates when fewer strict matches are available.
- Maximum of 5 final recommendations.
- Approximately 4–6 relevant conversation-history messages are considered.
- Server-side tool catalog cache uses a 5-minute TTL.

The system was evaluated against 30 discovery scenarios during Phase 2.1 testing. Testing showed approximately 100% candidate recall and approximately 90% Gemini reranking accuracy across the evaluated scenarios.

Observed limitations included some false negatives for academic research queries and some false positives for unsupported tasks such as certain spreadsheet or baking requests.

The current architecture does not require a vector database.

---

# 🚀 LakerAI Performance Improvements

The LakerAI architecture was optimized to reduce unnecessary client-side data transfer, Firestore reads, and Gemini token usage.

The optimization work includes:

- Server-side catalog retrieval.
- Five-minute catalog caching.
- Deterministic candidate scoring.
- Candidate limits before Gemini reranking.
- Reduced conversation history.
- Zod validation.
- Cross-reference validation.
- Client-side removal of the full `tools_published` subscription.
- Disabled assistant interaction while the user is actively typing.
- Lazy loading and component-level optimization.

Approximate Phase 2 performance improvements included:

- Approximately 60% token reduction.
- Approximately 99% reduction in client network upload associated with catalog transfer.
- Firestore reads reduced from repeated per-session catalog reads toward approximately one catalog read per five-minute server cache window on a warm server instance.

Actual performance can vary depending on deployment environment and serverless instance behavior.

---

# 🧰 AI Tool Specifications

Each published AI tool can contain structured information that helps users understand what the tool does before visiting the external product.

Tool information can include:

- Tool name.
- Description.
- Category.
- Tags.
- Website or product information.
- Supported capabilities.
- Educational or productivity use cases.
- Tool-specific metadata.
- Community information.
- AI governance information where applicable.

The directory is designed to provide enough context for users to understand the purpose of a tool rather than presenting only a name and URL.

---

# 📄 Tool Detail Pages

Individual tool pages provide a more detailed view of an AI product.

A tool detail experience can provide information about:

- What the tool does.
- Who it may be useful for.
- Supported use cases.
- Categories.
- Tags.
- Tool specifications.
- Community prompts where available.
- User interaction and feedback functionality.
- Reporting functionality.

The tool detail experience is designed to help users make an informed decision about whether a tool is relevant to their needs.

---

# 📝 Tool Submission & Review Lifecycle

The platform supports community tool submissions.

Users can submit an AI tool for consideration. Submitted tools are not automatically treated as published directory content.

The governance workflow separates submitted content from published content.

The primary collections include:

- `tools_submitted`
- `tools_published`

The governance team can review submitted tools before they become part of the public directory.

This provides a moderation layer between community submissions and published directory content.

---

# 🛡️ AI Governance

AI governance is an important part of the LakerAI Directory.

The platform is managed through an unofficial LakerAI Governance Hub where governance activities include reviewing submitted AI tools, monitoring user reports, reviewing community feedback, moderating AI assistant reports, reviewing community prompts, and maintaining the quality of published information.

The governance process is designed around responsible AI discovery rather than simply maximizing the number of tools listed.

AI governance responsibilities are shared between **Sujish** and **Joe**, with responsibilities covering platform development, AI governance, review, auditing, moderation, and quality oversight.

### Sujish

Sujish contributes to the development and maintenance of the LakerAI platform, including:

- AI platform development.
- AI tool discovery functionality.
- LakerAI Assistant development.
- AI/ML integration.
- Platform performance improvements.
- Prompt Library functionality.
- Testing and quality assurance.
- AI governance workflows.
- Tool moderation functionality.
- Community-facing platform features.

### Joe

Joe contributes to the governance and audit side of the platform, including:

- Governance review.
- Audit oversight.
- AI tool evaluation.
- Responsible AI considerations.
- Quality control.
- Review of platform governance workflows.
- Oversight of AI-related content and submissions.

The governance model is intended to combine technical platform development with human review and oversight.

---

# 🧠 AI-Assisted Tool Vetting

The platform includes AI-assisted evaluation capabilities for submitted AI tools.

The evaluation considers multiple dimensions, including:

### Security & Data Privacy

The system considers available information related to security, privacy, and potential data-handling concerns.

### Ethics / Stewardship

The system considers potential ethical and responsible-use considerations.

### Pedagogical Value

The system evaluates whether a tool may provide meaningful educational value.

### Institutional Readiness

The system considers whether the available information indicates readiness for institutional or educational use.

AI-assisted evaluation can produce outputs such as:

- Overall verdict.
- Pedagogical narrative.
- Scraped official image information where available.

AI-generated evaluation is intended to support governance workflows. It does not replace human review.

---

# 🖼️ Tool Image Management

The platform includes administrative image-management capabilities for AI tools.

The image workflow can inspect an external website for available image metadata such as:

- `og:image`
- `twitter:image`
- `apple-touch-icon`

When an appropriate image cannot be obtained, the platform can generate an abstract professional SVG-style visual rather than reproducing copyrighted product logos.

The image-management functionality is implemented through dedicated AI/server flows, including:

- `admin-image-management.ts`
- `admin-generates-tool-narrative-and-image.ts`

External website requests use timeout handling to prevent slow external sites from blocking the workflow indefinitely.

---

# 📚 Prompt Library

The LakerAI Prompt Library provides a community-oriented location for discovering and sharing useful AI prompts.

Users can browse prompts and review information such as:

- Prompt title.
- Prompt text.
- Description.
- System prompt where applicable.
- Target AI model.
- Category.
- Tags.
- Associated AI tool.
- Author information.
- Moderation status.

The Prompt Library is designed to help users discover reusable prompts rather than having to create every prompt from scratch.

---

# 🤖 Custom AI Models in the Prompt Library

The Prompt Library supports predefined AI models as well as custom models.

When a user selects:

> **Other**

the submission form allows the user to enter a custom AI model name.

For example:

> Claude Opus 6

The custom model information is stored and displayed as part of the prompt metadata.

The Firestore representation uses:

```text
targetModel: "Other"
model: "<custom model name>"
customModel: "<custom model name>"
```

Custom model names are also included in Prompt Library search and filtering.

The custom model field is optional for predefined models and required when `Other` is selected.

---

# 🔐 Prompt Moderation

Prompt submissions follow a moderation lifecycle.

Supported statuses include:

- `PENDING`
- `APPROVED`
- `REJECTED`

Administrators can review prompt submissions before they become approved community content.

The governance interface allows administrators to review and edit prompt information, including custom AI model information.

---

# 🏛️ Admin Portal

The Admin Portal is the primary governance and moderation interface for the LakerAI platform.

The portal is restricted to authorized administrators and provides multiple governance areas.

The major administrative areas include:

1. Tool Moderation
2. User Reports
3. Community Feedback
4. Chat Moderation
5. Prompt Moderation
6. Global News Management

The Admin Portal uses lazy-loaded tabs, query limits, memoized Firebase references, error isolation, and listener cleanup to improve performance and stability.

---

# 🧰 Tool Moderation

The Tool Moderation area manages submitted and published AI tools.

It works with:

```text
tools_submitted
tools_published
```

Submitted tools can be reviewed before publication.

The published tools view provides administrators with access to currently published directory content.

The current moderation queries use bounded result sets for the primary moderation lists:

- Submitted tools: latest 50.
- Published tools: latest 50.

This prevents the moderation interface from unnecessarily loading the entire collection during normal use.

---

# 🚨 User Reports

The User Reports section allows administrators to review reports submitted by users.

Reports are stored in:

```text
reports
```

The moderation interface retrieves recent reports and can resolve referenced tools against the published tool directory.

The current report query is limited to the latest 50 records.

This gives the governance team a centralized place to review potential problems reported by the community.

---

# 💬 Community Feedback

The Community Feedback section provides administrators with access to community feedback submitted through the platform.

Feedback is stored in:

```text
feedbackPosts
```

The governance team can use this information to understand:

- User concerns.
- Feature requests.
- Platform problems.
- Suggestions.
- General community feedback.

The current moderation view retrieves the latest 50 feedback posts.

---

# 🛡️ Chat Moderation

The Chat Moderation area handles reports related to the LakerAI Assistant.

Chat moderation records are stored in:

```text
chatModerationReports
```

This provides a governance workflow for reviewing problematic or inappropriate assistant interactions reported by users.

The current moderation query retrieves the latest 50 chat moderation reports.

---

# 📚 Prompt Moderation

Prompt Moderation provides governance controls for the community Prompt Library.

The moderation interface works with:

```text
promptLibrary
```

The current moderation list retrieves up to 100 recent prompt records.

Administrators can review prompt metadata, moderation status, associated tools, model information, and custom model information.

---

# 📰 Educational AI News

The platform includes an AI and educational news experience designed to help users stay informed about developments in AI.

News content is stored in:

```text
global_news
```

The news system can be refreshed through the application's administrative workflow.

The platform also includes a protected API route:

```text
/api/cron/news
```

The route uses:

```text
Authorization: Bearer CRON_SECRET
```

to protect scheduled refresh operations.

The current project uses the News API Developer plan for development/testing. Production scheduling through a service such as GCP Scheduler is not currently configured as an active production automation.

The news functionality is intended to complement the tool directory by helping users understand broader developments in AI and education.

---

# 🎓 Educational AI Resources

LakerAI is not limited to commercial AI products.

The platform is also designed to help the GVSU community discover educational AI resources and understand how AI can be used in academic and professional contexts.

Educational content can help users explore:

- AI-assisted learning.
- Research workflows.
- Writing assistance.
- Coding assistance.
- Data analysis.
- Productivity.
- Teaching and learning.
- AI literacy.
- Responsible AI use.

The educational side of the platform is intended to make AI more approachable for users who may be unfamiliar with current AI technologies.

---

# 🆘 Help & Support

The platform includes a Help and Support experience for users who need assistance.

The Help area includes components such as:

- AI Support.
- Community Feedback.
- Knowledge Base.

The AI Support experience can help users understand the platform and find relevant information.

The Knowledge Base provides structured support information.

Community Feedback gives users another channel for submitting suggestions and reporting issues.

---

# 👥 Community Participation

The LakerAI Directory is designed to support community participation rather than operating only as a static directory.

Users can participate by:

- Discovering tools.
- Submitting tools.
- Sharing prompts.
- Providing feedback.
- Reporting problematic content.
- Using the LakerAI Assistant.
- Exploring educational AI resources.
- Reviewing tool information.

Community participation is connected to governance workflows so that submitted information can be reviewed and moderated.

---

# 👍 Community Interaction

The platform contains community-oriented functionality associated with tools, prompts, feedback, and reports.

Relevant Firestore structures include:

```text
comments
user_votes
feedbackUpvotes
tickets
tickets/{ticketId}/messages
```

These structures support interaction and communication across different parts of the platform.

---

# 🔑 Authentication

The platform uses Firebase Authentication with Google Sign-In.

The authentication flow supports GVSU email domains:

```text
@gvsu.edu
@mail.gvsu.edu
```

The Google authentication provider uses account-selection behavior so users can select the appropriate Google account when signing in.

Firebase's browser authentication persistence allows authenticated sessions to remain available across refreshes and normal browser restarts unless the user explicitly signs out or the session is otherwise invalidated.

The application also prevents unauthorized domains from continuing as authenticated users.

---

# 👮 Administrator Access

Administrative access is controlled through the application's existing administrator authorization system.

The current administrator email whitelist includes:

```text
indrajis@mail.gvsu.edu
vanharkj@gvsu.edu
vanharkj@mail.gvsu.edu
joseph_email_here@gvsu.edu
```

These administrator identities must remain preserved.

The project does not use a custom-claims migration for administrator authorization.

---

# 🔐 Firebase & Firestore

Firebase provides the application's authentication and data infrastructure.

Firestore collections used by the platform include:

```text
tools_published
tools_submitted
promptLibrary
reports
feedbackPosts
chatModerationReports
user_profiles
admins
global_news
releaseChangelogs
config
```

Additional subcollections include structures such as:

```text
comments
user_votes
tickets
tickets/{ticketId}/messages
feedbackUpvotes
```

Firebase Admin functionality remains server-side.

Client-side code does not directly expose Firebase Admin credentials.

---

# 🧱 Application Architecture

The project uses a modern Next.js application architecture.

### Core Technologies

- Next.js 15.5.25
- React 19.2.x
- TypeScript
- Tailwind CSS
- Firebase
- Firestore
- Firebase Authentication
- Firebase Admin
- Genkit
- Google Gemini
- Zod
- Node.js
- Playwright
- GitHub Actions

---

# 🤖 Genkit & Gemini

Genkit is used for AI-assisted application workflows.

AI-related flows include:

```text
src/ai/genkit.ts
src/ai/flows/tool-discovery.ts
src/ai/flows/support-assistant.ts
src/ai/flows/fetch-global-news.ts
src/ai/flows/admin-generates-tool-narrative-and-image.ts
src/ai/flows/admin-image-management.ts
```

These flows support capabilities including:

- AI tool discovery.
- Assistant support.
- News retrieval.
- Administrative tool evaluation.
- AI-generated tool narratives.
- Tool image handling.

---

# ⚙️ Performance & Stability

Significant performance and stability work has been completed across the platform.

The application uses:

- Dynamic imports.
- Lazy-loaded administrative tabs.
- Firestore query limits.
- Memoized Firebase references.
- Listener cleanup.
- Server-side catalog caching.
- Reduced AI candidate sets.
- Error boundaries.
- Loading skeletons.
- Optimized authentication rendering.
- Reduced client-side Firestore subscriptions.

The Admin Portal was specifically optimized to avoid unnecessary top-level queries and unbounded listeners.

Inactive administrative tabs are unloaded so their listeners can be cleaned up.

---

# 🧩 Admin Portal Stability

The Admin Portal uses isolated error handling so a failure in one administrative section does not need to take down the entire portal.

Important administrative infrastructure includes:

```text
AdminErrorBoundary.tsx
AdminTabSkeleton.tsx
CronStatusIndicator.tsx
Tagger.tsx
```

Governance tabs are dynamically imported to reduce the initial JavaScript workload.

The application also uses memoized Firebase query references to avoid unnecessary listener recreation and React rendering loops.

---

# 🧪 Testing

The project includes unit, component, integration, and browser-level testing.

Testing infrastructure includes:

- Node native test runner.
- `node:assert`.
- `tsx`.
- Playwright.
- TypeScript checks.
- Production builds.
- GitHub Actions CI.

The project includes tests for:

- Prompt Library.
- Admin Portal.
- Homepage.
- Navigation.
- LakerAI Assistant.
- Tool detail pages.
- User workflows.
- Firebase-related application behavior.

---

# 🌐 End-to-End Testing

True browser-based Playwright testing covers major user workflows.

The verified E2E areas include:

- Admin Portal.
- Homepage.
- LakerAI Assistant.
- Navigation.
- Prompt Library.
- Tool Detail pages.

The final audit reported all configured Playwright E2E tests passing.

The final verification also reported:

- No hydration errors.
- No React maximum update-depth errors.
- No unmemoized Firebase `useDoc` / `useCollection` issues.
- No listener leaks.
- No unhandled promise rejections.
- No unexpected 404/500 application errors during the tested workflows.

---

# 🔄 CI/CD

The project includes GitHub Actions CI.

The CI workflow performs core verification such as:

```text
TypeScript typecheck
Automated tests
Production build
```

This helps prevent regressions from being merged into the development workflow.

---

# 📁 Project Structure

A simplified structure of the project is:

```text
src/
├── ai/
│   ├── genkit.ts
│   └── flows/
│       ├── tool-discovery.ts
│       ├── support-assistant.ts
│       ├── fetch-global-news.ts
│       ├── admin-generates-tool-narrative-and-image.ts
│       └── admin-image-management.ts
│
├── app/
│   ├── admin-portal/
│   ├── dashboard/
│   ├── help/
│   ├── reports/
│   ├── settings/
│   ├── prompt-library/
│   ├── testing/
│   ├── api/
│   │   └── cron/
│   │       └── news/
│   └── page.tsx
│
├── components/
│   ├── admin/
│   ├── help/
│   ├── news/
│   ├── prompt-library/
│   ├── tools/
│   ├── GVSUHeader.tsx
│   └── LakerAIAssistant.tsx
│
├── firebase/
│   ├── client
│   ├── provider
│   ├── hooks
│   └── auth
│
└── lib/
    ├── auth-context.tsx
    ├── firebase.ts
    ├── firebase-admin.ts
    ├── content-moderation.ts
    └── ...
```

---

# 🧪 Testing Dashboard

The project contains an internal testing dashboard available through:

```text
/testing
```

The testing dashboard is protected for development/administrative use and provides visibility into application testing workflows.

---

# 📊 Data & Governance Collections

The application uses structured Firestore collections for different platform responsibilities.

### Published Tools

```text
tools_published
```

Contains tools that are available in the public directory.

### Submitted Tools

```text
tools_submitted
```

Contains tools awaiting governance review.

### Prompt Library

```text
promptLibrary
```

Contains community prompt submissions and moderation metadata.

### User Reports

```text
reports
```

Contains reports submitted by users.

### Community Feedback

```text
feedbackPosts
```

Contains community feedback and suggestions.

### Chat Moderation

```text
chatModerationReports
```

Contains reports related to the LakerAI Assistant.

### Global News

```text
global_news
```

Contains AI and educational news content.

---

# 🛠️ Development Environment

The application can be run locally using the standard Next.js development workflow.

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run TypeScript validation:

```bash
npm run typecheck
```

Run automated tests:

```bash
npm test
```

Run the production build:

```bash
npm run build
```

Run Playwright tests:

```bash
npx playwright test
```

---

# 🔐 Environment Variables

Sensitive environment values must not be committed to Git.

The project uses environment files such as:

```text
.env
.env.local
.env.example
```

Real credentials and secrets should remain in local or deployment environment configuration.

`.env.example` should contain placeholders rather than real secrets.

---

# 🌎 Deployment

The application is designed for deployment using a modern Next.js-compatible hosting environment together with Firebase services.

Deployment responsibilities include:

- Next.js application hosting.
- Firebase Authentication.
- Firestore.
- Server-side Firebase Admin functionality.
- Gemini/Genkit services.
- Environment configuration.
- Secure secret management.

Production deployments should use the appropriate environment variables and secrets rather than committing credentials to the repository.

---

# 🧑‍💻 Development Philosophy

The LakerAI Directory is designed around several principles:

### Discoverability

Users should be able to find useful AI tools even when they do not know the exact product name.

### Responsible AI

AI discovery should include consideration of security, privacy, ethics, educational value, and institutional readiness.

### Human Oversight

AI-assisted governance should support administrators rather than completely replacing human review.

### Community Participation

Students, faculty, and other community members should be able to contribute tools, prompts, feedback, and reports.

### Performance

The platform should avoid unnecessary database reads, client-side subscriptions, AI token usage, and large initial JavaScript bundles.

### Maintainability

Features should be separated into understandable application components and workflows.

---

# 🚀 Major Platform Features

The LakerAI Directory currently combines the following major capabilities:

- AI Tool Directory.
- AI Tool Search.
- AI Tool Filtering.
- AI Tool Detail Pages.
- LakerAI Assistant.
- AI-powered tool discovery.
- Tool submission.
- Tool moderation.
- AI-assisted tool vetting.
- Tool image management.
- Community reports.
- Community feedback.
- Chat moderation.
- Prompt Library.
- Custom AI model support.
- Prompt moderation.
- Educational AI resources.
- AI and educational news.
- Help and support.
- Knowledge Base.
- User authentication.
- Administrative governance.
- Performance optimization.
- Automated testing.
- CI/CD verification.

---

# 🏛️ Governance Team

This repository is managed by the unofficial LakerAI Governance Hub.

- Lead: [indrajis@mail.gvsu.edu](mailto:indrajis@mail.gvsu.edu)
- Audit Lead: [joseph_email_here@gvsu.edu](mailto:joseph_email_here@gvsu.edu)

The governance process is collaboratively supported by Sujish and Joe, combining technical development, AI governance, auditing, moderation, and responsible AI oversight.

---

# 📜 Disclaimer

*The LakerAI Directory is a community discovery tool and does not represent official University endorsement. Always consult IT and Legal services for formal sanctioned software procurement.*

---

# 📄 License and Usage

This project is intended for the development and operation of the LakerAI Directory / GVSU AI Exchange platform.

Usage, redistribution, deployment, and modification should follow the applicable project, institutional, and repository requirements.

---

# ❤️ Final Note

LakerAI Directory is intended to be more than a list of AI websites.

It combines **AI discovery, intelligent search, educational resources, community participation, prompt sharing, AI news, responsible AI governance, moderation, and administrative oversight** into one platform.

The goal is to provide a practical environment where members of the GVSU community can discover AI technologies, understand their potential uses, share useful resources, and participate in a responsible AI ecosystem.

The platform continues to evolve as new AI technologies, governance requirements, educational use cases, and community needs emerge.
