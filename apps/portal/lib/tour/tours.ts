/**
 * Tour step definitions for each dashboard route.
 * Each entry maps a pathname to an ordered list of driver.js steps.
 * Elements are targeted by the `data-tour` attribute added to page elements.
 */
export interface TourStep {
  /** CSS selector — uses [data-tour="<id>"] convention */
  element: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
  };
}

export const TOURS: Record<string, TourStep[]> = {
  "/dashboard": [
    {
      element: "[data-tour='dashboard-stats']",
      popover: {
        title: "Your Key Metrics",
        description: "At a glance: active campaigns, total leads, emails sent, replies, and booked meetings. All values update in real time once your outreach is live.",
        side: "bottom",
      },
    },
    {
      element: "[data-tour='dashboard-quick-actions']",
      popover: {
        title: "Quick Actions",
        description: "Jump to the most common tasks. We recommend starting with 'Train AI Brain' — it teaches RevLooper your product so all outreach sounds authentic.",
        side: "top",
      },
    },
    {
      element: "[data-tour='nav-campaigns']",
      popover: {
        title: "Campaigns",
        description: "Create and manage outreach campaigns. The AI builder will write your email sequences based on your AI Brain knowledge.",
        side: "right",
      },
    },
    {
      element: "[data-tour='nav-leads']",
      popover: {
        title: "Leads",
        description: "Import, verify, and score your prospect list. Supports CSV upload and LinkedIn import.",
        side: "right",
      },
    },
  ],

  "/campaigns": [
    {
      element: "[data-tour='campaigns-header']",
      popover: {
        title: "Campaigns Overview",
        description: "Each campaign targets a specific audience segment with a tailored outreach sequence. Keep active campaigns focused — quality beats volume.",
        side: "bottom",
      },
    },
    {
      element: "[data-tour='campaigns-new-btn']",
      popover: {
        title: "Create a Campaign",
        description: "Click here to launch the AI campaign builder. It will suggest email copy, subject lines, and follow-up timing based on your AI Brain.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='campaigns-filter']",
      popover: {
        title: "Filter by Status",
        description: "Switch between Active, Draft, Paused, and Archived campaigns. Pause a campaign any time without losing its data.",
        side: "bottom",
      },
    },
    {
      element: "[data-tour='campaigns-list']",
      popover: {
        title: "Campaign Cards",
        description: "Click any campaign to see its sequence steps, open/reply rates, and individual lead activity. Green badges = AI-generated copy.",
        side: "top",
      },
    },
  ],

  "/leads": [
    {
      element: "[data-tour='leads-header']",
      popover: {
        title: "Lead Database",
        description: "All your B2B prospects in one place. Each lead is automatically scored 0–100 based on fit, intent signals, and email validity.",
        side: "bottom",
      },
    },
    {
      element: "[data-tour='leads-import-btn']",
      popover: {
        title: "Import Leads",
        description: "Upload a CSV or paste LinkedIn profile URLs. RevLooper will verify emails and enrich missing fields automatically.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='leads-search']",
      popover: {
        title: "Search & Filter",
        description: "Filter by country, score, status, or any tag. Build segments here to target specific audiences in a campaign.",
        side: "bottom",
      },
    },
    {
      element: "[data-tour='leads-table']",
      popover: {
        title: "Lead Rows",
        description: "Click a row to open the full lead profile: enrichment data, email history, AI-generated personalisation, and score breakdown.",
        side: "top",
      },
    },
  ],

  "/ai-brain": [
    {
      element: "[data-tour='ai-brain-header']",
      popover: {
        title: "AI Brain — Your Secret Weapon",
        description: "This is where you train RevLooper's AI on your product, ICP, case studies, and messaging guidelines. Better training = better outreach.",
        side: "bottom",
      },
    },
    {
      element: "[data-tour='ai-brain-sources']",
      popover: {
        title: "Knowledge Sources",
        description: "Add your website URL, paste product descriptions, upload PDFs, or write free-form notes. The AI chunks and embeds everything into a private vector store.",
        side: "right",
      },
    },
    {
      element: "[data-tour='ai-brain-test']",
      popover: {
        title: "Test Your AI",
        description: "Ask a question like 'Why should a SaaS founder in Vietnam use us?' to preview how the AI will draw on your knowledge when writing outreach.",
        side: "top",
      },
    },
  ],

  "/sequences": [
    {
      element: "[data-tour='sequences-header']",
      popover: {
        title: "Email Sequences",
        description: "A sequence is the step-by-step playbook for a campaign: email 1, wait 3 days, follow-up, LinkedIn touch, and so on.",
        side: "bottom",
      },
    },
    {
      element: "[data-tour='sequences-list']",
      popover: {
        title: "Your Sequences",
        description: "Click a sequence to open the visual builder. Drag steps to reorder, set wait times, and add conditional branches based on whether the lead replied.",
        side: "top",
      },
    },
  ],

  "/inbox": [
    {
      element: "[data-tour='inbox-threads']",
      popover: {
        title: "Unified Inbox",
        description: "All inbound replies from every campaign and channel appear here. No more switching between email tabs.",
        side: "right",
      },
    },
    {
      element: "[data-tour='inbox-reply-area']",
      popover: {
        title: "AI-Suggested Replies",
        description: "RevLooper reads the conversation and suggests a reply. Edit it, approve it, or let the AI send it automatically based on your rules.",
        side: "top",
      },
    },
  ],

  "/meetings": [
    {
      element: "[data-tour='meetings-header']",
      popover: {
        title: "Meeting Booking",
        description: "Your personal booking page is auto-generated. Share the link in your email sequences to let leads schedule directly into your calendar.",
        side: "bottom",
      },
    },
    {
      element: "[data-tour='meetings-calendar']",
      popover: {
        title: "Upcoming Meetings",
        description: "See all booked calls with lead context — company, deal stage, and email thread — so you walk in prepared.",
        side: "top",
      },
    },
  ],

  "/scoring": [
    {
      element: "[data-tour='scoring-header']",
      popover: {
        title: "AI Lead Scoring",
        description: "Every lead gets a 0–100 score based on email validity, job seniority, ICP fit, and behavioural signals like email opens.",
        side: "bottom",
      },
    },
    {
      element: "[data-tour='scoring-list']",
      popover: {
        title: "Score Breakdown",
        description: "Click any lead to see exactly why they scored high or low. You can override scores and the model learns from your feedback.",
        side: "top",
      },
    },
  ],

  "/crm": [
    {
      element: "[data-tour='crm-board']",
      popover: {
        title: "CRM Pipeline",
        description: "Drag deals across the Kanban board as prospects progress. Deals are automatically created when a lead books a meeting or replies positively.",
        side: "bottom",
      },
    },
  ],

  "/analytics": [
    {
      element: "[data-tour='analytics-header']",
      popover: {
        title: "Campaign Analytics",
        description: "Track open rates, reply rates, bounce rates, and meeting conversions across all campaigns. Use A/B test data to improve your copy.",
        side: "bottom",
      },
    },
  ],

  "/settings": [
    {
      element: "[data-tour='settings-tabs']",
      popover: {
        title: "Workspace Settings",
        description: "Configure your workspace, connect your email sending account, manage team members, set up your booking calendar, and control billing here.",
        side: "bottom",
      },
    },
  ],
};

/** Key used to persist which tours have been completed */
export const TOUR_STORAGE_KEY = "rl_tour_done";

export function getTourDoneKey(pathname: string) {
  return `${TOUR_STORAGE_KEY}:${pathname}`;
}
