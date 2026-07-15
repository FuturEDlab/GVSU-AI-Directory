
'use server';
/**
 * @fileOverview Automated Ingestion Vetting Agent & Image Scraper.
 * Orchestrates institutional auditing across 4 core academic criteria.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as cheerio from 'cheerio';

const VettingInputSchema = z.object({
  toolTitle: z.string(),
  toolDescription: z.string(),
  toolUrl: z.string().url(),
});

const ReportCardItemSchema = z.object({
  score: z.number().describe('1-5 rating'),
  summary: z.string(),
});

const VettingOutputSchema = z.object({
  scrapedOgImage: z.string().nullable(),
  reportCard: z.object({
    security: ReportCardItemSchema,
    ethics: ReportCardItemSchema,
    pedagogy: ReportCardItemSchema,
    readiness: ReportCardItemSchema,
  }),
  overallVerdict: z.string().describe('String summarizing tool utility for university faculty.'),
  pedagogicalNarrative: z.string().describe('A professional 2-sentence description for the hub.'),
});

export type VettingOutput = z.infer<typeof VettingOutputSchema>;

const scrapeOgImage = ai.defineTool(
  {
    name: 'scrapeOgImage',
    description: 'Scrapes the Open Graph (og:image) metadata from a given URL headers.',
    inputSchema: z.object({ url: z.string().url() }),
    outputSchema: z.string().nullable(),
  },
  async ({ url }) => {
    try {
      const response = await fetch(url, { 
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 (LakerAI Academic Auditor)' }
      });
      if (!response.ok) return null;
      const html = await response.text();
      const $ = cheerio.load(html);
      const imageUrl = $('meta[property="og:image"]').attr('content') || 
                       $('meta[name="twitter:image"]').attr('content') ||
                       $('link[rel="apple-touch-icon"]').attr('href');
      
      if (imageUrl && !imageUrl.startsWith('http')) {
        const baseUrl = new URL(url);
        return `${baseUrl.protocol}//${baseUrl.host}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }
      return imageUrl || null;
    } catch {
      return null;
    }
  }
);

const vettingPrompt = ai.definePrompt({
  name: 'vettingPrompt',
  input: { schema: VettingInputSchema },
  output: { schema: VettingOutputSchema.omit({ scrapedOgImage: true }) },
  config: { temperature: 0.1 },
  prompt: `You are an Elite Institutional IT Compliance Officer auditing applications for deployment across higher education university campuses.
Analyze the metadata of the provided tool and generate objective assessments across exactly four mandatory categories:

1. Security & Data Privacy: Rate student data exposure risk, likelihood of FERPA/GDPR violations, and tracking transparency.
2. Ethics/Stewardship: Identify bias mitigation, structural transparency, plagiarism vectors, or academic integrity impacts.
3. Pedagogical Value: Evaluate instructional utility, classroom scalability, cognitive scaffolding assistance, and teaching efficiency.
4. Institutional Readiness: Grade operational stability, implementation overhead, financial model viability, and accessibility compliance indicators.

Also provide a professional, high-impact, 2-sentence description for the "pedagogicalNarrative" field.

Tool Title: {{{toolTitle}}}
URL: {{{toolUrl}}}
Description: {{{toolDescription}}}`,
});

export async function automatedVettingAgent(input: z.infer<typeof VettingInputSchema>): Promise<VettingOutput> {
  const scrapedOgImage = await scrapeOgImage({ url: input.toolUrl });
  const { output } = await vettingPrompt(input);

  if (!output) throw new Error("Vetting agent failed to generate report.");

  return {
    ...output,
    scrapedOgImage,
  };
}
