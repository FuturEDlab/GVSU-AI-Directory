import { PromptSubmission } from '@/app/lib/prompt-types';

export const MOCK_PROMPTS = [
  {
    id: 'prompt-1',
    title: 'Syllabus Generator',
    promptName: 'Syllabus Generator',
    description: 'Generates an outcome-aligned course syllabus template.',
    promptTemplate: 'Write a comprehensive course syllabus for [SUBJECT] at GVSU level [LEVEL].',
    promptText: 'Write a comprehensive course syllabus for [SUBJECT] at GVSU level [LEVEL].',
    targetModel: 'GPT-4o',
    model: 'GPT-4o',
    category: 'Teaching & Pedagogy',
    status: 'APPROVED',
    submittedByEmail: 'indrajis@mail.gvsu.edu',
    authorName: 'Indrajit S',
    createdAt: Date.now() - 86400000
  },
  {
    id: 'prompt-2',
    title: 'APA Citation Reviewer',
    promptName: 'APA Citation Reviewer',
    description: 'Validates academic reference citations in APA 7th format.',
    promptTemplate: 'Review the following references for APA 7th style compliance: [REFERENCES]',
    promptText: 'Review the following references for APA 7th style compliance: [REFERENCES]',
    targetModel: 'Claude 3.5 Sonnet',
    model: 'Claude 3.5 Sonnet',
    category: 'Research & Writing',
    status: 'PENDING',
    submittedByEmail: 'student@mail.gvsu.edu',
    authorName: 'Student User',
    createdAt: Date.now() - 43200000
  }
] as PromptSubmission[];
