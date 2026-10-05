# LakerAI Directory 🏛️🤖

An unofficial, community-focused AI tool discovery and governance platform for Grand Valley State University (GVSU). LakerAI helps Lakers discover AI tools, evaluate them through a structured governance workflow, share prompts, discuss tools, and access AI-powered assistance.

> **Disclaimer:** LakerAI Directory is a community discovery and evaluation platform and does not represent official GVSU endorsement, procurement approval, or institutional security/legal approval. Users should consult the appropriate GVSU offices before adopting software for official university use.

---

## 🌟 What is LakerAI?

LakerAI Directory provides a central place for the GVSU community to discover and evaluate AI resources.

The platform combines:

- AI-powered tool discovery
- Community tool submissions
- Administrative moderation and governance
- AI-assisted tool vetting
- Prompt sharing and moderation
- Community feedback and reporting
- AI support assistance
- Global AI/technology news
- User dashboards and submission tracking
- Authentication and role-based access
- Performance-focused Firebase/Firestore data access

The goal is to make AI discovery easier while encouraging responsible, critical evaluation of AI technologies in an academic environment.

---

## ✨ Core Features

### 🔎 AI Tool Directory

The main directory displays published AI tools with searchable and categorized information.

Users can:

- Browse published AI tools
- Search for tools
- Filter tools by category and tags
- Open individual AI tool detail pages
- View tool descriptions and pedagogical information
- Interact with community features
- Submit reports and feedback

---

### 🤖 LakerAI Assistant

The LakerAI Assistant provides natural-language AI tool discovery.

A user can ask questions such as:

> "I need an AI tool for creating presentations."

The system:

1. Receives the user's request.
2. Retrieves a bounded candidate set from the published tool catalog.
3. Uses deterministic token-based retrieval and scoring to identify relevant candidates.
4. Sends the strongest candidates to Gemini for contextual reranking.
5. Validates the returned recommendations against the published catalog.
6. Returns ranked recommendations with explanations.

The retrieval architecture uses server-side caching to reduce repeated Firestore reads.

Current design includes:

- Server-side published-tool catalog retrieval
- Five-minute in-memory catalog cache
- Deterministic candidate scoring
- Bounded Gemini candidate sets
- Zod validation
- Cross-reference validation against real tool IDs
- Shortened relevant conversation history
- Maximum five final recommendations

This architecture reduces unnecessary client-side catalog transfer and repeated Firestore reads while keeping the assistant responsive.

---

### 📝 Smart Tool Submission

Authenticated GVSU users can submit AI tools for review.

Submissions capture information such as:

- Tool title
- Category
- Description
- URL
- Submitter information
- Tags and metadata
- Submission status

Submitted tools enter the governance workflow before becoming publicly available.

Users can also track their submitted tools through the dashboard.

---

### 🛡️ Admin Portal & Governance

The Admin Portal provides authorized administrators with governance and moderation tools.

Major areas include:

- Tool Moderation
- User Reports
- Community Feedback
- Chat Moderation
- Prompt Moderation
- Ticketing and support workflows
- Global news management
- Tool tagging and governance metadata

The Admin Portal uses lazy-loaded tabs, isolated error boundaries, loading states, bounded Firestore queries, and listener cleanup to reduce unnecessary initial work and improve reliability.

Administrative access is restricted through the existing Firebase authentication and administrator whitelist.

> The existing administrator whitelist is intentionally preserved in both application authentication logic and Firestore rules.

---

### 🧠 AI-Assisted Tool Vetting

Administrative workflows can use Genkit/Gemini-powered assistance to evaluate submitted tools.

The vetting flow evaluates four areas:

1. **Security & Data Privacy**
2. **Ethics / Stewardship**
3. **Pedagogical Value**
4. **Institutional Readiness**

The system can also:

- Generate a pedagogical narrative
- Analyze a submitted tool URL
- Discover official website imagery
- Produce a structured vetting report
- Return information for administrator review before publication

AI-generated content is intended to assist administrators; it does not replace human review.

---

### 🖼️ Tool Image Management

The platform supports multiple image workflows for AI tools.

#### Official image discovery

The system can inspect a tool's official URL for:

- `og:image`
- `twitter:image`
- Apple touch icons

#### AI-generated visual

When an official image is unavailable or a generated visual is preferred, the system can generate a professional abstract SVG representation using Gemini.

Generated visuals are designed to avoid reproducing copyrighted logos.

Image management is implemented through:

```text
src/ai/flows/admin-image-management.ts
src/ai/flows/admin-generates-tool-narrative-and-image.ts
