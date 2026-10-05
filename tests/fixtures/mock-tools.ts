import { ToolSubmission } from '@/app/lib/tool-types';
import { SimplifiedTool } from '@/ai/utils/tool-retrieval';

export const MOCK_SIMPLIFIED_TOOLS: SimplifiedTool[] = [
  {
    id: 'tool-canvas',
    name: 'Canvas LMS AI Assistant',
    description: 'Generative AI tools integrated into Canvas for grading and quiz creation.',
    category: 'Teaching & Learning',
    tags: 'grading, quiz, canvas, teaching'
  },
  {
    id: 'tool-gamma',
    name: 'Gamma App',
    description: 'AI-powered presentation and document generator for academic lectures.',
    category: 'Presentation & Media',
    tags: 'presentation, slides, lecture, media'
  },
  {
    id: 'tool-julius',
    name: 'Julius AI',
    description: 'Data analysis and spreadsheet visualization tool using natural language.',
    category: 'Data Analysis',
    tags: 'data, analysis, spreadsheet, excel, chart'
  },
  {
    id: 'tool-elicit',
    name: 'Elicit Research Assistant',
    description: 'Automated literature review and academic paper search assistant.',
    category: 'Research & Writing',
    tags: 'research, paper, literature, citation, academic'
  },
  {
    id: 'tool-midjourney',
    name: 'Midjourney Image Generator',
    description: 'Generative AI model for high-resolution artistic image synthesis.',
    category: 'Creative AI',
    tags: 'image, art, graphic, creative, design'
  }
];

export const MOCK_TOOL_SUBMISSIONS = [
  {
    id: 'tool-gamma',
    title: 'Gamma App',
    category: 'Presentation & Media',
    initialDescription: 'AI-powered presentation generator',
    pedagogicalNarrative: 'Accelerates lecture deck generation.',
    toolUrl: 'https://gamma.app',
    status: 'Published',
    isVerified: true,
    upvotes: 24,
    downvotes: 1,
    aiVetted: true,
    tags: {
      security_privacy: ['FERPA Compliant'],
      ethics_stewardship: ['Citation Required'],
      pedagogical_value: ['High Engagement'],
      institutional_status: ['Approved Service'],
      access_cost: ['Free Tier Available']
    }
  },
  {
    id: 'tool-pending-1',
    title: 'ResearchBot Pro',
    category: 'Research & Writing',
    initialDescription: 'AI citation helper for research papers',
    toolUrl: 'https://researchbot.example.edu',
    status: 'Submitted',
    isVerified: false,
    upvotes: 0,
    downvotes: 0
  }
] as ToolSubmission[];
