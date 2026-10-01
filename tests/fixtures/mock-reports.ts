import { UserReport } from '@/app/lib/tool-types';

export const MOCK_REPORTS: UserReport[] = [
  {
    id: 'report-1',
    toolId: 'tool-gamma',
    toolName: 'Gamma App',
    reportedBy: 'student1@mail.gvsu.edu',
    reporterEmail: 'student1@mail.gvsu.edu',
    reporterName: 'Laker Student',
    issueType: 'Broken Link',
    reason: 'Broken Link',
    description: 'The access link redirects to a 404 page.',
    comments: 'The access link redirects to a 404 page.',
    status: 'Pending',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'report-2',
    toolId: 'tool-julius',
    toolName: 'Julius AI',
    reportedBy: 'faculty1@gvsu.edu',
    reporterEmail: 'faculty1@gvsu.edu',
    reporterName: 'GVSU Faculty',
    issueType: 'Security Concern',
    reason: 'Security Concern',
    description: 'Data privacy policy needs institutional update.',
    status: 'Resolved',
    createdAt: Date.now() - 7200000
  }
];
