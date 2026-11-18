import type { Lifecycle } from "./records";

/**
 * The list views in the left navigation.
 *
 * A view is just a named filter over northstar_records. Keeping them here
 * rather than scattered across routes means the navigation, the page title and
 * the query can never disagree, and adding a view is one entry.
 *
 * The rendering of a list view is deliberately NOT here - Ryan is supplying the
 * house pattern for that, and it drops into the single page component that
 * reads these definitions.
 */
export type RecordView = {
  /** URL segment: /records/<key> */
  key: string;
  /** Label in the navigation. */
  label: string;
  /** Heading on the page. */
  title: string;
  lifecycle: Lifecycle;
  /** true = active only; false = active and inactive. */
  activeOnly: boolean;
  description: string;
};

export const VIEW_GROUPS: { lifecycle: Lifecycle; views: RecordView[] }[] = [
  {
    lifecycle: "Idea",
    views: [
      {
        key: "ideas-active",
        label: "All Active Ideas",
        title: "All Active Ideas",
        lifecycle: "Idea",
        activeOnly: true,
        description: "Ideas still in play.",
      },
    ],
  },
  {
    lifecycle: "Demand",
    views: [
      {
        key: "demands-active",
        label: "All Active Demands",
        title: "All Active Demands",
        lifecycle: "Demand",
        activeOnly: true,
        description: "Demands still in play.",
      },
      {
        key: "demands-all",
        label: "All Demands",
        title: "All Demands",
        lifecycle: "Demand",
        activeOnly: false,
        description: "Every demand, active and inactive.",
      },
    ],
  },
  {
    lifecycle: "Project",
    views: [
      {
        key: "projects-active",
        label: "All Active Projects",
        title: "All Active Projects",
        lifecycle: "Project",
        activeOnly: true,
        description: "Projects still in play.",
      },
    ],
  },
];

export const VIEWS: RecordView[] = VIEW_GROUPS.flatMap((g) => g.views);

export function viewByKey(key: string): RecordView | undefined {
  return VIEWS.find((v) => v.key === key);
}
