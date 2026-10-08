import { z } from 'zod';
import type { ContactSubmission } from './contact';

// These are display links. Eve's web-fetch tool handles network safety.
const sourceUrlSchema = z.url({ protocol: /^https$/ }).refine((value) => {
  const url = URL.parse(value);
  return url !== null && !url.username && !url.password;
}, 'Use an HTTPS URL without credentials.');

export const researchResultSchema = z.object({
  companyDescription: z.string().max(360).trim().min(1),
  match: z.enum(['matched', 'ambiguous', 'unknown']),
  nycOffice: z.enum(['confirmed', 'outside_nyc', 'unknown']),
  premiumOffice: z.enum(['strong', 'some', 'unknown']),
  purchaseIntent: z.enum(['explicit', 'exploratory', 'none']),
  // Optional for previously stored research; absent signals stay unknown.
  projectScope: z.enum(['full_project', 'limited', 'unknown']).optional(),
  timing: z.string().max(160).trim().min(1).optional(),
  confidence: z.enum(['high', 'medium', 'low']),
  rationale: z.string().max(300).trim().min(1),
  sources: z.array(z.object({
    title: z.string().max(120).trim().min(1),
    url: sourceUrlSchema,
  })).max(3),
});

export type ResearchResult = z.infer<typeof researchResultSchema>;

// Keep these keys aligned with TEAM_SIZES via the shared submission type.
const teamSizePoints: Record<ContactSubmission['teamSize'], number> = {
  '1–10': 1, '11–50': 2, '51–200': 3, '201–1,000': 5, '1,000+': 5,
};
const budgetPoints: Record<ContactSubmission['budget'], number> = {
  'Under $10,000': 0, '$10,000–$29,999': 10, '$30,000–$50,000': 40,
  'Over $50,000': 35, 'Not sure yet': 0,
};

// Demo ICP-fit heuristic for custom framing and display in high-end NYC spaces,
// not a conversion probability. Callers validate research with the shared schema.
export function scoreLead(
  research: ResearchResult | undefined,
  teamSize: ContactSubmission['teamSize'],
  budget?: ContactSubmission['budget'],
): {
  score: number;
  label: 'Strong fit' | 'Possible fit' | 'Low fit';
  breakdown: { nycOffice: number; premiumOffice: number; teamSize: number; purchaseIntent: number; budget: number };
} {
  const breakdown = {
    nycOffice: { confirmed: 30, outside_nyc: 0, unknown: 0 }[research?.nycOffice ?? 'unknown'],
    premiumOffice: { strong: 15, some: 8, unknown: 0 }[research?.premiumOffice ?? 'unknown'],
    teamSize: teamSizePoints[teamSize],
    purchaseIntent: { explicit: 10, exploratory: 5, none: 0 }[research?.purchaseIntent ?? 'none'],
    budget: budgetPoints[budget ?? 'Not sure yet'],
  };
  // Always score the available signals. Unknown factors simply earn no points.
  const score = breakdown.nycOffice + breakdown.premiumOffice + breakdown.teamSize + breakdown.purchaseIntent + breakdown.budget;
  const qualified = research?.match === 'matched' && research.confidence !== 'low'
    && research.nycOffice === 'confirmed' && research.premiumOffice !== 'unknown'
    && research.purchaseIntent === 'explicit' && research.projectScope === 'full_project';
  return { score, label: score >= 75 && qualified ? 'Strong fit' : score >= 45 ? 'Possible fit' : 'Low fit', breakdown };
}

// Drafts only: no outbound email or automatic consultation booking.
export function leadNextSteps(research: ResearchResult | undefined, budget?: ContactSubmission['budget']) {
  const questions: string[] = [];
  if (!budget || budget === 'Not sure yet') questions.push('What budget range are you planning for the full project?');
  if (!research?.timing) questions.push('What is your target installation date or project timeline?');
  if (!research || research.projectScope === undefined || research.projectScope === 'unknown') {
    questions.push('Are you looking for a full framing and display project, including design, fabrication, and installation?');
  }
  const promising = research?.match === 'matched' && research.confidence !== 'low'
    && research.nycOffice === 'confirmed' && research.premiumOffice !== 'unknown'
    && research.purchaseIntent !== 'none' && research.projectScope !== 'limited'
    && (!budget || budget === 'Not sure yet' || budget === '$30,000–$50,000' || budget === 'Over $50,000');
  const draftReply = promising
    ? ['Thanks for reaching out. We are an end-to-end framing and display studio, supporting design, fabrication, and installation for premium NYC spaces.',
      'We would be happy to explore your project in a design consultation.', ...questions].join(' ')
    : undefined;
  return { questions, draftReply };
}
