/**
 * What a modern, AI-native project management system needs.
 *
 * Written as a discussion aid for the Northstar project, with Loma Linda's
 * current ServiceNow footprint as the baseline. `servicenow` says how well the
 * platform already covers it today, so the conversation can be about the gap
 * rather than about rebuilding what exists.
 *
 * This is a reference list, not a backlog. Work items are tracked separately.
 */
export type Coverage = "Covered" | "Partial" | "Gap";

export type Capability = {
  name: string;
  detail: string;
  servicenow: Coverage;
};

export type CapabilityGroup = {
  group: string;
  items: Capability[];
};

export const CAPABILITIES: CapabilityGroup[] = [
  {
    group: "Intake and demand",
    items: [
      {
        name: "One front door for requests",
        detail:
          "Every idea, project request and enhancement arrives the same way, with the same questions asked up front.",
        servicenow: "Covered",
      },
      {
        name: "Automatic triage and routing",
        detail:
          "The system reads a request and proposes the right portfolio, sponsor and sizing instead of waiting for a human to classify it.",
        servicenow: "Partial",
      },
      {
        name: "Duplicate and overlap detection",
        detail:
          "Flags that a new request resembles work already in flight - the single most common source of wasted effort in a large IS shop.",
        servicenow: "Gap",
      },
      {
        name: "Business case drafting",
        detail:
          "Turns a few sentences from a requester into a structured case: problem, benefit, rough cost, affected systems.",
        servicenow: "Gap",
      },
    ],
  },
  {
    group: "Planning and scheduling",
    items: [
      {
        name: "Plans generated from intent",
        detail:
          "Describe the outcome and get a draft plan - phases, tasks, dependencies - based on how similar projects actually ran here.",
        servicenow: "Gap",
      },
      {
        name: "Dependency awareness across projects",
        detail:
          "Knows that two projects need the same environment, the same vendor or the same three people, and says so before both are approved.",
        servicenow: "Partial",
      },
      {
        name: "Honest date forecasting",
        detail:
          "Predicts finish dates from this organisation's delivery history rather than from what the plan says.",
        servicenow: "Gap",
      },
      {
        name: "Scenario comparison",
        detail:
          "Answer “what happens if we delay this, or add two people” without rebuilding the schedule by hand.",
        servicenow: "Gap",
      },
    ],
  },
  {
    group: "Resource and capacity",
    items: [
      {
        name: "Who is actually available",
        detail:
          "Real capacity across projects, operations and leave - not a spreadsheet that was true last month.",
        servicenow: "Partial",
      },
      {
        name: "Skills matching",
        detail:
          "Suggests who could do the work based on what they have done before, including people outside the usual team.",
        servicenow: "Gap",
      },
      {
        name: "Overallocation warnings",
        detail:
          "Tells a manager that a named person is committed to four projects this quarter before it becomes a slipped date.",
        servicenow: "Partial",
      },
    ],
  },
  {
    group: "Execution and status",
    items: [
      {
        name: "Status without status meetings",
        detail:
          "Assembles a current picture from the systems where work actually happens, rather than asking people to retype it weekly.",
        servicenow: "Gap",
      },
      {
        name: "Drift detection",
        detail:
          "Notices a project has quietly stopped moving and raises it, rather than waiting for a red status someone chose to set.",
        servicenow: "Gap",
      },
      {
        name: "Meeting notes to actions",
        detail:
          "Turns a Teams recording or transcript into owned, dated tasks on the right project.",
        servicenow: "Gap",
      },
      {
        name: "Ask the portfolio a question",
        detail:
          "“Which projects touch Epic this quarter and who owns them” answered in plain language, for people who will never learn a report builder.",
        servicenow: "Gap",
      },
    ],
  },
  {
    group: "Risk and issues",
    items: [
      {
        name: "Risks surfaced, not just recorded",
        detail:
          "Proposes risks from the shape of the project and from what went wrong on similar ones, instead of an empty register nobody fills in.",
        servicenow: "Partial",
      },
      {
        name: "Early warning on delivery",
        detail:
          "Ranks which projects are most likely to miss, with the reasons, so attention goes where it changes an outcome.",
        servicenow: "Gap",
      },
    ],
  },
  {
    group: "Financials and benefits",
    items: [
      {
        name: "Budget against actuals",
        detail: "Plan, committed and spent in one place, current enough to act on.",
        servicenow: "Covered",
      },
      {
        name: "Benefits tracked after go-live",
        detail:
          "The promised benefit is revisited months later. Almost nobody does this, and it is what makes a portfolio credible to a CFO.",
        servicenow: "Gap",
      },
    ],
  },
  {
    group: "Reporting and governance",
    items: [
      {
        name: "Narrative reporting",
        detail:
          "Drafts the steering committee update - what changed, what is at risk, what needs a decision - from the underlying data.",
        servicenow: "Gap",
      },
      {
        name: "Audit trail by default",
        detail:
          "Who approved what, when, and on what information. Non-negotiable in a health system.",
        servicenow: "Covered",
      },
      {
        name: "Decisions captured where they happen",
        detail:
          "A decision log that is a by-product of running the project, not a document someone maintains.",
        servicenow: "Partial",
      },
    ],
  },
  {
    group: "Integration",
    items: [
      {
        name: "ServiceNow as the system of record",
        detail:
          "Northstar should read and write ServiceNow rather than become a second place to keep the truth.",
        servicenow: "Covered",
      },
      {
        name: "Microsoft 365 and Teams",
        detail:
          "Documents, meetings and chat are where project work already lives. Identity is already wired - Northstar signs in with Entra today.",
        servicenow: "Partial",
      },
      {
        name: "Identity governance",
        detail:
          "Project access reflects role and assignment automatically, rather than a list someone maintains by hand.",
        servicenow: "Partial",
      },
    ],
  },
  {
    group: "Trust and safety",
    items: [
      {
        name: "Every AI claim traceable",
        detail:
          "A forecast or summary can be opened up to show what it was based on. Without this, nobody senior will rely on it twice.",
        servicenow: "Gap",
      },
      {
        name: "Clear boundary on patient data",
        detail:
          "A project system in a health system will have PHI pasted into it eventually. The rule has to be enforced, not just written down.",
        servicenow: "Partial",
      },
      {
        name: "Human approval on consequential actions",
        detail:
          "The system can draft, suggest and warn. It should not reassign people or change dates on its own.",
        servicenow: "Gap",
      },
    ],
  },
];
