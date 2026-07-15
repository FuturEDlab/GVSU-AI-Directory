# **App Name**: LakerAI Directory

## Core Features:

- Institutional Header & Navigation: A fully branded GVSU header with dynamic utility links, main navigation, search, sign-in/out functionality, and conditional access to the Admin Portal based on user email.
- Smart Tool Submission: Users can submit new AI tools via a modal form, capturing details like title, category, description, and URL, with the submitter's GVSU Display Name and Email automatically recorded. These tools initiate into a 7-stage lifecycle.
- Personalized Submission Tracking: A dedicated user dashboard allowing submitters to view and track the progress of their submitted tools through a visual, 7-stage progress stepper.
- Secure Admin Portal: A restricted '/admin-portal' route accessible only to 'indrajis@mail.gvsu.edu' for managing tool statuses through the 7-stage lifecycle.
- AI-Enhanced Publishing Tool: Admins can use an AI tool (Gemini 3.0 Flash) to automatically generate a professional 2-sentence Pedagogical Narrative and scrape an 'og:image' for submitted tools, with an editable text area for final admin review before official publication.
- Public AI Tool Discovery Hub: A responsive masonry grid display of all live (published) AI tools, featuring scraped high-resolution thumbnails, title, verified badge, the final pedagogical narrative, and external links opening in new tabs.
- Tool Interaction & Social Features: Allows users to engage with tools through atomic upvote/downvote buttons and a nested threaded comment section below each tool for faculty/student discussion.

## Style Guidelines:

- Primary Color: GVSU Blue (#0032A0) for key navigational elements, text accents, and branding.
- Background Color: Pure White (#FFFFFF) as the main page background, with a very light grey-blue (#ECF0F2) used for subtle secondary section or card backgrounds, tying into the primary GVSU blue hue.
- Text Color: Solid Black (#000000) for general body text, with all bold text specifically using GVSU Blue (#0032A0).
- Accent Color: A vibrant purple (#601EE3) for interactive elements, call-to-action buttons, and highlights to provide strong contrast and visual interest.
- Headlines: 'Literata' (serif) for an elegant, institutional feel.
- Body Text: 'Inter' (sans-serif) for clean, modern readability.
- Clean and professional vector-based icons for all UI elements, status indicators, voting, and administrative actions, maintaining a cohesive institutional aesthetic consistent with Tailwind CSS component libraries.
- A responsive top utility bar for global actions, main navigation with a horizontal GV monogram and 'GRAND VALLEY STATE UNIVERSITY' title, a small centered search bar (max-width: 300px), and a dedicated secondary bar displaying the title 'Artificial Intelligence (AI) at GVSU: LakerAI Directory'. The tool display features a responsive masonry grid.
- Subtle and smooth transitions for modals, navigation expansions, and progress tracker stages, ensuring a refined and responsive user experience.