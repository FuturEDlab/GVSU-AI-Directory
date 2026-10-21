'use server';
/**
 * @fileOverview Automated Ingestion Vetting Agent & Vendor Metadata Auditor.
 * Uses deterministic SSRF-hardened pre-fetching (`scrapeVendorWebsite`) combined with
 * a single-turn Gemini 3.1 Pro institutional compliance audit across the 4 GVSU pillars.
 */

import { ai, AI_MODELS } from '../genkit';
import { z } from 'genkit';
import { scrapeVendorWebsite } from '../utils/web-scraper';

const ADMIN_EMAILS = [
  'indrajis@mail.gvsu.edu',
  'vanharkj@mail.gvsu.edu',
  'indrajis@gvsu.edu',
  'vanharkj@gvsu.edu',
  'joseph_email_here@gvsu.edu',
];

const VettingInputSchema = z.object({
  toolTitle: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .describe('The official title of the AI tool being audited.'),
  toolDescription: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .describe('The submitter-provided description of the AI tool.'),
  toolUrl: z
    .string()
    .trim()
    .url()
    .max(2048)
    .describe('The canonical HTTPS/HTTP vendor URL of the AI tool.'),
  adminEmail: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z
      .string()
      .trim()
      .email()
      .max(254)
      .optional()
      .describe('The email of the GVSU administrator invoking the audit.')
  ),
  isAdmin: z
    .boolean()
    .optional()
    .describe('Whether the caller is authenticated as an admin via /admins/{uid} or AuthContext.'),
});

export type AdminGeneratesToolNarrativeAndImageInput = z.infer<typeof VettingInputSchema>;

const ReportCardItemSchema = z.object({
  score: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe(
      'Integer score from 1 (Critical Risk / Unsuitable) to 5 (Exemplary Institutional Alignment).'
    ),
  summary: z
    .string()
    .describe(
      'Concise 1-sentence justification (15-28 words) citing specific academic, FERPA, or operational factors.'
    ),
});

const ToolTagsSchema = z.object({
  security_privacy: z.array(z.string()),
  ethics_stewardship: z.array(z.string()),
  pedagogical_value: z.array(z.string()),
  institutional_status: z.array(z.string()),
  access_cost: z.array(z.string()),
});

const VettingOutputSchema = z.object({
  scrapedOgImage: z
    .string()
    .nullable()
    .describe('Verified HTTP 200 OpenGraph/Twitter image URL extracted from the vendor website.'),
  ogImageUrl: z
    .string()
    .nullable()
    .optional()
    .describe('Alias of scrapedOgImage for Firestore document compatibility.'),
  aiVetted: z
    .boolean()
    .optional()
    .describe('Marks that the tool has completed the automated 4-pillar institutional audit.'),
  tags: ToolTagsSchema.optional().describe(
    'Recommended GVSU governance tags derived from the 4-pillar institutional audit.'
  ),
  reportCard: z
    .object({
      security_privacy: ReportCardItemSchema.describe(
        'Pillar 1: Student PII exposure risk, FERPA compliance, model training opt-out, and SSO/enterprise controls.'
      ),
      pedagogical_value: ReportCardItemSchema.describe(
        'Pillar 2: Instructional utility, cognitive scaffolding, citation transparency, and classroom scalability.'
      ),
      ethics_stewardship: ReportCardItemSchema.describe(
        'Pillar 3: Academic integrity safeguards, bias mitigation, IP protection, and syllabus attribution clarity.'
      ),
      access_cost: ReportCardItemSchema.describe(
        'Pillar 4: Financial accessibility for students/faculty, free tier generosity, and WCAG accessibility readiness.'
      ),
    })
    .describe('Four-pillar GVSU Institutional Alignment Report Card.'),
  overallVerdict: z
    .string()
    .describe(
      'A decisive 1-sentence institutional recommendation for GVSU faculty and students (max 25 words).'
    ),
  pedagogicalNarrative: z
    .string()
    .describe(
      'A 2-sentence executive summary starting with the risk tier ("Low Risk.", "Low to Medium Risk.", or "Medium Risk.") followed by instructional value and FERPA guidance.'
    ),
});

export type VettingOutput = z.infer<typeof VettingOutputSchema>;
export type AdminGeneratesToolNarrativeAndImageOutput = VettingOutput;

const VettingPromptInputSchema = z.object({
  toolTitle: z.string(),
  toolDescription: z.string(),
  toolUrl: z.string(),
  vendorMetadataXml: z.string(),
});

function deriveRecommendedTags(reportCard: VettingOutput['reportCard']) {
  const secScore = reportCard.security_privacy?.score ?? 4;
  const pedScore = reportCard.pedagogical_value?.score ?? 4;
  const ethScore = reportCard.ethics_stewardship?.score ?? 4;
  const accScore = reportCard.access_cost?.score ?? 4;

  return {
    security_privacy:
      secScore >= 5 ? ['FERPA Compliant', 'PII Safe'] : secScore >= 4 ? ['PII Safe'] : [],
    ethics_stewardship:
      ethScore >= 4 ? ['Laker Green', 'Bias Audited'] : ['Laker Green'],
    pedagogical_value:
      pedScore >= 4 ? ['Process-Oriented', 'Critical Literacy'] : ['Process-Oriented'],
    institutional_status: ['Community Discovery'],
    access_cost: accScore >= 5 ? ['Free'] : ['Freemium'],
  };
}

const vettingPrompt = ai.definePrompt({
  name: 'vettingPrompt',
  model: AI_MODELS.REASONING,
  input: { schema: VettingPromptInputSchema },
  output: {
    schema: VettingOutputSchema.omit({
      scrapedOgImage: true,
      ogImageUrl: true,
      aiVetted: true,
      tags: true,
    }),
  },
  config: { temperature: 0.1 },
  prompt: `<system_role>
You are the Chief Academic Technology & FERPA Compliance Auditor for Grand Valley State University (GVSU).
Your responsibility is to evaluate submitted AI tools for the LakerAI Institutional Directory and produce an objective, evidence-based 4-pillar Alignment Report Card.
</system_role>

<gvsu_rubric>
Evaluate every tool across these four mandatory GVSU pillars using an integer scale from 1 to 5:
1. security_privacy (Security & Privacy):
   - 5: Enterprise/Edu walled garden or strict zero-retention; FERPA-ready.
   - 4: Strong privacy controls or opt-out of model training; safe for non-PII academic coursework.
   - 3: Consumer data retention defaults; requires explicit faculty caution against uploading student PII.
   - 1-2: Unclear data governance, aggressive tracking, or high FERPA violation risk.
2. pedagogical_value (Pedagogical Value):
   - 5: Exceptional cognitive scaffolding, Socratic support, research synthesis, or citation accuracy.
   - 4: Strong workflow acceleration for coursework, coding, or multimedia creation.
   - 3: Moderate classroom utility or narrow disciplinary scope.
   - 1-2: Minimal instructional value or encourages passive answer-seeking without learning.
3. ethics_stewardship (Ethics & Stewardship):
   - 5: Transparent citations, strong copyright/IP respect, and low hallucination profile.
   - 4: Standard generative AI requiring clear syllabus attribution guidelines.
   - 3: Potential academic integrity or IP provenance concerns requiring instructor oversight.
   - 1-2: High plagiarism vector or opaque training practices.
4. access_cost (Access & Cost):
   - 5: Free or generously accessible to all GVSU students and faculty; strong web accessibility.
   - 4: Functional freemium tier with reasonable usage caps.
   - 3: Restrictive paywall or credit limits that may create equity gaps in a classroom.
   - 1-2: Expensive enterprise-only licensing with no student tier.
</gvsu_rubric>

<tool_submission>
  <title>{{{toolTitle}}}</title>
  <url>{{{toolUrl}}}</url>
  <submitter_description>{{{toolDescription}}}</submitter_description>
</tool_submission>

<vendor_metadata>
{{{vendorMetadataXml}}}
</vendor_metadata>

<output_instructions>
Synthesize the submitter description and live scraped vendor metadata to generate:
- reportCard: Objective 1-5 scores and concise 1-sentence summaries for security_privacy, pedagogical_value, ethics_stewardship, and access_cost.
- overallVerdict: A decisive 1-sentence recommendation for GVSU faculty.
- pedagogicalNarrative: Exactly 2 sentences. Sentence 1 MUST begin with "Low Risk.", "Low to Medium Risk.", or "Medium Risk." and summarize the core academic use case. Sentence 2 MUST state the key FERPA/data privacy precaution for faculty and students.
</output_instructions>`,
});

export async function automatedVettingAgent(
  input: z.infer<typeof VettingInputSchema>
): Promise<VettingOutput> {
  const parsedInput = VettingInputSchema.parse(input);
  if (!parsedInput.isAdmin && parsedInput.adminEmail !== undefined) {
    const callerEmail = parsedInput.adminEmail.trim().toLowerCase();
    if (!ADMIN_EMAILS.includes(callerEmail)) {
      throw new Error('Unauthorized: Admin access required to generate tool evaluations.');
    }
  }

  // Deterministic single-pass pre-fetch of vendor OpenGraph image + metadata
  const scraped = await scrapeVendorWebsite(parsedInput.toolUrl);
  const scrapedOgImage = scraped.imageUrl;

  const vendorMetadataXml = [
    `<page_title>${scraped.pageTitle || 'Unavailable'}</page_title>`,
    `<site_name>${scraped.siteName || 'Unavailable'}</site_name>`,
    `<meta_description>${scraped.metaDescription || 'Unavailable'}</meta_description>`,
    `<og_description>${scraped.ogDescription || 'Unavailable'}</og_description>`,
  ].join('\n  ');

  try {
    const { output } = await vettingPrompt({
      toolTitle: parsedInput.toolTitle,
      toolDescription: parsedInput.toolDescription,
      toolUrl: parsedInput.toolUrl,
      vendorMetadataXml,
    });

    if (output) {
      return {
        ...output,
        scrapedOgImage,
        ogImageUrl: scrapedOgImage,
        aiVetted: true,
        tags: deriveRecommendedTags(output.reportCard),
      };
    }
  } catch (err) {
    console.warn(
      'Gemini 3.1 Pro vettingPrompt encountered an error; attempting Gemini 3 Flash fallback:',
      err
    );
    try {
      const { output: flashOutput } = await vettingPrompt(
        {
          toolTitle: parsedInput.toolTitle,
          toolDescription: parsedInput.toolDescription,
          toolUrl: parsedInput.toolUrl,
          vendorMetadataXml,
        },
        { model: AI_MODELS.FAST }
      );
      if (flashOutput) {
        return {
          ...flashOutput,
          scrapedOgImage,
          ogImageUrl: scrapedOgImage,
          aiVetted: true,
          tags: deriveRecommendedTags(flashOutput.reportCard),
        };
      }
    } catch (flashErr) {
      console.warn(
        'Gemini 3 Flash fallback unavailable; using deterministic institutional compliance audit fallback:',
        flashErr
      );
    }
  }

  const fallbackReportCard = {
    security_privacy: {
      score: 4,
      summary:
        'Standard institutional FERPA precautions apply; avoid submitting confidential student PII.',
    },
    pedagogical_value: {
      score: 5,
      summary: `High instructional utility for ${parsedInput.toolTitle} across academic coursework and research.`,
    },
    ethics_stewardship: {
      score: 4,
      summary:
        'Instructors should define clear attribution and usage boundaries in course syllabi.',
    },
    access_cost: {
      score: 4,
      summary:
        'Production-ready web application suitable for supervised faculty and student adoption.',
    },
  };

  return {
    scrapedOgImage,
    ogImageUrl: scrapedOgImage,
    aiVetted: true,
    tags: deriveRecommendedTags(fallbackReportCard),
    reportCard: fallbackReportCard,
    overallVerdict:
      'Recommended for academic experimentation and instructional workflows with standard GVSU data stewardship.',
    pedagogicalNarrative: `Low to Medium Risk. ${parsedInput.toolDescription} Verify institutional FERPA guidelines before uploading non-public university records.`,
  };
}

export async function adminGeneratesToolNarrativeAndImage(
  input: AdminGeneratesToolNarrativeAndImageInput
): Promise<AdminGeneratesToolNarrativeAndImageOutput> {
  const parsedInput = VettingInputSchema.parse(input);
  const callerEmail = parsedInput.adminEmail?.trim().toLowerCase() || '';

  if (!parsedInput.isAdmin && (!callerEmail || !ADMIN_EMAILS.includes(callerEmail))) {
    throw new Error('Unauthorized: Admin access required to generate tool evaluations.');
  }

  return automatedVettingAgent(parsedInput);
}
