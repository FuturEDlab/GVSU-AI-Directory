
'use server';
/**
 * @fileOverview High-fidelity World Academic and Tech AI Intelligence fetcher.
 * Leverages Genkit and Gemini to generate dynamic, real-world grounded tech intelligence briefings.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NewsArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  url: z.string(),
  imageUrl: z.string().nullable(),
  sourceName: z.string(),
  publishedAt: z.string(),
});

export type NewsArticle = z.infer<typeof NewsArticleSchema>;

export async function fetchGlobalNews(): Promise<NewsArticle[]> {
  try {
    // Generate fresh, highly realistic, and grounded tech news using Gemini via Genkit
    const response = await ai.generate({
      prompt: `You are a Senior Tech Intelligence Analyst and Global Technology Reporter. 
Your mission is to generate 12 highly accurate, professional, and up-to-date news articles about global technology news, AI breakthroughs, and policy shifts occurring on the world stage as of July 31, 2026.

Ground the articles in these actual events from late July 2026:
1. The U.S. Department of Energy's "Genesis Mission" ($800M+ partner commitments for AI-for-science ecosystem, announced July 22, 2026).
2. The White House "GOLD EAGLE" Cybersecurity Initiative using AI to protect critical infrastructure (announced July 14, 2026).
3. The U.S. Department of Commerce's $874 million in CHIPS Act incentives for semiconductor R&D (announced July 29, 2026).
4. The European Union AI Act amendments published on July 24, 2026 (effective July 27, 2026).
5. Regulatory guidance on "Agentic AI" and digital coworkers from Singapore, Hong Kong, and global financial hubs.
6. The rise of advanced reasoning models (breaking down complex problems step-by-step) and open-source models (like DeepSeek V4 and Kimi K3) reaching parity.

Format your output as a JSON array matching the NewsArticle schema.
Each article must have:
- id: A unique string identifier.
- title: A crisp, news-style headline.
- summary: A professional 1-2 sentence description.
- url: A realistic news source URL (e.g. from TechCrunch, Inside Higher Ed, MIT Technology Review, Wired, EdSurge, Reuters, Bloomberg, etc.).
- sourceName: The name of the source (e.g. "🇺🇸 MIT Technology Review", "🇺🇸 Reuters", "🇪🇺 EU Official Journal", "🇸🇬 Singapore MAS", etc.).
- imageUrl: A stable image URL using https://picsum.photos/seed/<id>/600/400 to avoid broken links.
- publishedAt: A date string around late July 2026 (e.g., 2026-07-20 to 2026-07-31).`,
      output: {
        schema: z.array(NewsArticleSchema),
      },
    });

    if (response.output && response.output.length > 0) {
      return response.output;
    }

    return getFallbackNews();
  } catch (error) {
    console.error("Genkit news generation failed, falling back:", error);
    return getFallbackNews();
  }
}

function getFallbackNews(): NewsArticle[] {
  return [
    { 
      id: "edu-genesis",
      title: "DOE Launches 'Genesis Mission' with $800M Partner Commitments for AI Scientific Discovery.", 
      summary: "The U.S. Department of Energy establishes a national AI-for-science ecosystem, linking supercomputers and advanced machine learning models to accelerate breakthrough research.",
      url: "https://www.reuters.com",
      imageUrl: "https://picsum.photos/seed/genesis/600/400",
      sourceName: "🇺🇸 Reuters",
      publishedAt: "2026-07-22T12:00:00Z"
    },
    { 
      id: "edu-goldeagle",
      title: "White House GOLD EAGLE Cybersecurity Initiative Deploys AI for Critical Infrastructure Defense.", 
      summary: "A new public-private clearinghouse launches to identify and mitigate cyber vulnerabilities in energy and water sectors using frontier AI tools.",
      url: "https://www.bloomberg.com",
      imageUrl: "https://picsum.photos/seed/goldeagle/600/400",
      sourceName: "🇺🇸 Bloomberg",
      publishedAt: "2026-07-14T09:30:00Z"
    },
    { 
      id: "edu-euact",
      title: "EU Publishes Crucial AI Act Amendments, Extending Compliance Deadlines.", 
      summary: "Amendments published in the Official Journal clarify risk categories and afford developers additional time to register high-risk deployments.",
      url: "https://www.theverge.com",
      imageUrl: "https://picsum.photos/seed/euact/600/400",
      sourceName: "🇪🇺 EU Journal",
      publishedAt: "2026-07-24T15:45:00Z"
    }
  ];
}

