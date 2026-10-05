# LakerAI Directory 🏛️🤖

## AI Discovery, Governance, Education, and Community Platform

LakerAI Directory is an unofficial, community-focused AI discovery, education, governance, and community platform developed for the Grand Valley State University (GVSU) community. The platform provides a centralized environment where students, faculty, staff, administrators, and other authorized members of the community can discover artificial intelligence tools, understand their potential educational and professional uses, search for tools using natural language, submit new AI resources, share reusable prompts, report issues, provide feedback, access AI support, and stay informed about developments in artificial intelligence and educational technology.

LakerAI is designed to be more than a traditional AI tool directory. The platform combines AI-powered discovery, structured tool specifications, educational context, community participation, AI-assisted governance, administrative moderation, prompt sharing, reporting, support, and AI-related news into a single application. The system is designed to help users discover AI resources while encouraging responsible evaluation of security, privacy, ethics, educational value, accessibility, institutional readiness, and appropriate use.

> **Important:** LakerAI Directory is an unofficial community discovery and evaluation platform. It does not represent official Grand Valley State University endorsement, procurement approval, security certification, legal approval, accessibility certification, institutional sanctioning, or official approval of any AI product. The appearance of an AI tool in the directory does not automatically mean that the tool is approved for official university use. Users should consult the appropriate GVSU IT, Legal, Privacy, Accessibility, Procurement, academic, and administrative offices before using software for official university purposes.

---

# 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Vision and Goals](#-vision-and-goals)
- [Who Can Use LakerAI](#-who-can-use-lakerai)
- [Platform Overview](#-platform-overview)
- [Front-End Experience](#-front-end-experience)
- [AI Tool Directory](#-ai-tool-directory)
- [AI Tool Specifications](#-ai-tool-specifications)
- [AI Tool Detail Pages](#-ai-tool-detail-pages)
- [AI Tool Discovery](#-ai-tool-discovery)
- [LakerAI Assistant](#-lakerai-assistant)
- [LakerAI Retrieval Architecture](#-lakerai-retrieval-architecture)
- [Educational AI Resources](#-educational-ai-resources)
- [AI and Educational News](#-ai-and-educational-news)
- [AI Tool Submission](#-ai-tool-submission)
- [Tool Governance Workflow](#-tool-governance-workflow)
- [AI Governance](#-ai-governance)
- [AI-Assisted Tool Vetting](#-ai-assisted-tool-vetting)
- [Governance Evaluation Categories](#-governance-evaluation-categories)
- [Tool Image Management](#-tool-image-management)
- [Prompt Library](#-prompt-library)
- [Prompt Submission](#-prompt-submission)
- [Custom AI Model Support](#-custom-ai-model-support)
- [Community Feedback](#-community-feedback)
- [User Reports](#-user-reports)
- [Chat Moderation](#-chat-moderation)
- [Help and Support](#-help-and-support)
- [User Dashboard](#-user-dashboard)
- [Settings](#-settings)
- [Admin Portal](#-admin-portal)
- [Admin Tool Moderation](#-admin-tool-moderation)
- [Admin User Reports](#-admin-user-reports)
- [Admin Community Feedback](#-admin-community-feedback)
- [Admin Chat Moderation](#-admin-chat-moderation)
- [Admin Prompt Moderation](#-admin-prompt-moderation)
- [Admin News Management](#-admin-news-management)
- [Admin Tagging](#-admin-tagging)
- [Support and Ticketing](#-support-and-ticketing)
- [Authentication](#-authentication)
- [Administrator Authorization](#-administrator-authorization)
- [Application Architecture](#-application-architecture)
- [Frontend Architecture](#-frontend-architecture)
- [Backend Architecture](#-backend-architecture)
- [Firebase Architecture](#-firebase-architecture)
- [Firestore Architecture](#-firestore-architecture)
- [Firestore Security Model](#-firestore-security-model)
- [AI and Genkit Architecture](#-ai-and-genkit-architecture)
- [AI Flows](#-ai-flows)
- [Performance Engineering](#-performance-engineering)
- [Error Handling and Reliability](#-error-handling-and-reliability)
- [Testing Architecture](#-testing-architecture)
- [Unit Testing](#-unit-testing)
- [Component Testing](#-component-testing)
- [Integration Testing](#-integration-testing)
- [End-to-End Testing](#-end-to-end-testing)
- [Testing Dashboard](#-testing-dashboard)
- [Current Validation](#-current-validation)
- [CI/CD](#-cicd)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [Environment Variables](#-environment-variables)
- [Local Development](#-local-development)
- [Production Build](#-production-build)
- [Deployment](#-deployment)
- [Security Practices](#-security-practices)
- [Known Limitations](#-known-limitations)
- [Future Improvements](#-future-improvements)
- [Main Routes](#-main-routes)
- [Important Files](#-important-files)
- [Developer Guidelines](#-developer-guidelines)
- [Governance Team](#-governance-team)
- [Disclaimer](#-disclaimer)
- [License and Usage](#-license-and-usage)

---

# 🌟 Project Overview

LakerAI Directory provides a centralized AI discovery and governance environment for the GVSU community.

The platform addresses the growing difficulty of identifying useful AI resources as the number of available AI products continues to increase. Instead of requiring users to know the name of an AI product before searching for it, LakerAI allows users to describe what they want to accomplish and use the LakerAI Assistant to discover relevant tools.

The platform also provides structured information about AI tools so that users can understand not only what a tool does, but also how it may relate to teaching, learning, research, productivity, and other academic or professional workflows.

At the administrative level, LakerAI provides a Governance Hub where authorized administrators can review tool submissions, evaluate AI resources, manage reports, moderate community content, review prompts, manage news, and oversee the overall health of the platform.

The platform therefore combines five major concepts:

1. **AI Discovery**
2. **AI Education**
3. **AI Governance**
4. **Community Participation**
5. **Administrative Oversight**

---

# 🎯 Vision and Goals

The primary goal of LakerAI is to make AI easier to discover while encouraging responsible and informed AI adoption.

The platform is designed to:

- Centralize AI tool discovery.
- Make AI tools easier to search.
- Allow natural-language tool discovery.
- Provide meaningful tool specifications.
- Highlight potential educational applications.
- Support students, faculty, and staff.
- Allow users to recommend new AI tools.
- Provide an administrative review process.
- Support AI-assisted governance.
- Provide reusable AI prompts.
- Allow users to report issues.
- Allow users to submit community feedback.
- Provide AI-related and educational news.
- Provide AI support for platform questions.
- Give administrators centralized governance controls.
- Reduce unnecessary application and database overhead.
- Maintain strong authentication and authorization controls.
- Provide automated testing and CI validation.

---

# 👥 Who Can Use LakerAI?

LakerAI is designed for multiple groups within the GVSU community.

## Students

Students can use LakerAI to discover AI tools that may support:

- Studying
- Writing
- Research
- Presentations
- Programming
- Data analysis
- Brainstorming
- Productivity
- Learning activities
- Other academic workflows

Students can also:

- Ask LakerAI for recommendations.
- Browse the Prompt Library.
- Submit tools.
- Report issues.
- Submit feedback.
- Access help resources.

## Faculty

Faculty can use the platform to explore AI resources for:

- Teaching
- Course development
- Research
- Assessment
- Content creation
- Data analysis
- Academic productivity
- Student learning activities

## Staff

Staff can explore tools that may support:

- Productivity
- Communication
- Data analysis
- Administrative workflows
- Documentation
- Research
- Content creation

## Administrators and Governance Reviewers

Authorized administrators use the Governance Hub to:

- Review tools.
- Evaluate AI resources.
- Moderate prompts.
- Review reports.
- Manage community feedback.
- Review chat moderation reports.
- Manage news.
- Maintain platform governance.

---

# 🖥️ Platform Overview

The LakerAI platform consists of several connected areas.

### Main Directory

The central location for discovering published AI tools.

### LakerAI Assistant

Natural-language AI-powered tool discovery.

### Tool Detail Pages

Detailed information about individual AI resources.

### Prompt Library

Reusable AI prompts submitted and reviewed by the community.

### Dashboard

User-specific activity and submissions.

### Reports

Community reporting functionality.

### Help Hub

Support resources and AI-powered assistance.

### News

AI and educational technology news.

### Admin Portal

Governance and administrative management.

### Testing Dashboard

Internal application testing and validation.

### Settings

User configuration and preferences.

---

# 🖥️ Front-End Experience

The front end is built to provide a simple and accessible experience for users who may not have technical knowledge about AI.

The main directory allows users to search for tools, browse available resources, explore categories, and open detailed tool pages.

The interface connects the major areas of the platform so users can move between tool discovery, prompts, reports, help, dashboard functionality, and other resources without needing to understand the underlying Firebase or AI architecture.

The front-end experience is intentionally designed around the user's task rather than around the technical implementation.

A user should be able to come to LakerAI with a request such as:

> "I need an AI tool for research."

and move directly toward relevant resources.

The LakerAI Assistant is integrated into the main discovery experience rather than requiring the user to open a separate popup or modal.

---

# 🔎 AI Tool Directory

The AI Tool Directory is the primary discovery experience.

Published AI tools are displayed using structured information that helps users quickly understand what each tool provides.

Users can:

- Search tools.
- Browse tools.
- Filter tools.
- Explore categories.
- Review tags.
- Open individual tool pages.
- View tool descriptions.
- Review educational information.
- Access community-related functionality.
- Report issues.

The directory is populated by tools that have reached the appropriate published state through the governance workflow.

---

# 🧰 AI Tool Specifications

Each AI tool can contain structured specifications.

These specifications help users understand the tool beyond its name.

## Basic Specifications

A tool may contain:

- Tool name
- Official website
- Description
- Category
- Tags
- Status
- Submission information
- Publication information

## Educational Specifications

The platform can provide information relating to potential uses in:

- Teaching
- Learning
- Research
- Writing
- Programming
- Data analysis
- Presentations
- Productivity
- Collaboration

## Governance Specifications

The tool evaluation process can provide information relating to:

- Security
- Privacy
- Ethics
- Stewardship
- Pedagogical value
- Institutional readiness

The purpose of these specifications is to help users make informed decisions rather than treating all AI products as equivalent.

---

# 🔎 AI Tool Detail Pages

The individual tool page provides a more detailed view of a published AI resource.

The page can provide:

- Tool name
- Description
- Official website
- Category
- Tags
- Educational context
- Governance information
- Community information
- Associated prompts
- User interaction options
- Reporting functionality

The individual tool page provides the main place where a user can evaluate a resource before deciding whether it is relevant to their needs.

---

# 🔍 AI Tool Discovery

Traditional keyword search is not the only discovery mechanism in LakerAI.

Users can describe the task they want to accomplish using natural language.

For example:

> "I need an AI tool for creating presentations."

> "What AI tools can help me with coding?"

> "I need something for data analysis."

> "What tools can help with research?"

The system retrieves candidate tools based on structured metadata and then uses Gemini to rerank those candidates based on the user's request.

---

# 🤖 LakerAI Assistant

The LakerAI Assistant is the natural-language discovery system integrated into the main platform.

Instead of searching only by exact tool names, users can describe the task they want to accomplish.

The assistant is designed specifically around **AI tool discovery**, rather than functioning as an unrestricted general-purpose chatbot.

The assistant:

1. Receives the user's request.
2. Retrieves relevant candidates from the published tool catalog.
3. Scores candidates using deterministic retrieval.
4. Sends a bounded candidate set to Gemini.
5. Allows Gemini to rerank the candidates.
6. Validates the response.
7. Cross-checks returned tool IDs against the actual published catalog.
8. Displays the final recommendations.

---

# 🧠 LakerAI Retrieval Architecture

The LakerAI Assistant uses a two-stage retrieval and ranking system.

```text
User Request
      ↓
Natural Language Query
      ↓
Server-Side Published Tool Catalog
      ↓
Deterministic Retrieval
      ↓
Candidate Scoring
      ↓
Bounded Candidate Set
      ↓
Gemini Reranking
      ↓
Schema Validation
      ↓
Tool ID Cross-Reference
      ↓
Final Recommendations
