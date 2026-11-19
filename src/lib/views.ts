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
  /** Label in the navigation: the shortcut's name, e.g. "Active Demands". */
  label: string;
  /** Heading on the page: the TABLE's name, e.g. "Demands". The view's filter
   *  shows in the breadcrumb trail beneath it, like ServiceNow (Ryan,
   *  2026-11-19; list view standard 11a). */
  title: string;
  /** Undefined means every lifecycle - see EFFORT_VIEWS. */
  lifecycle?: Lifecycle;
  /** true = active only; false = active and inactive. */
  activeOnly: boolean;
  description: string;
};

/**
 * Everything, whatever its lifecycle. An effort is an idea, a demand or a
 * project - the same record at a different stage - so these sit above the
 * lifecycle groups rather than inside one. The Lifecycle column is what tells
 * them apart, and it is in the registry already.
 */
export const EFFORT_VIEWS: RecordView[] = [
  {
    key: "efforts-active",
    label: "Active Efforts",
    title: "Efforts",
    activeOnly: true,
    description: "Every idea, demand and project still in play.",
  },
  {
    key: "efforts-all",
    label: "All Efforts",
    title: "Efforts",
    activeOnly: false,
    description: "Every effort, at any stage, active and inactive.",
  },
];

export const VIEW_GROUPS: { lifecycle: Lifecycle; views: RecordView[] }[] = [
  {
    lifecycle: "Idea",
    views: [
      {
        key: "ideas-active",
        label: "Active Ideas",
        title: "Ideas",
        lifecycle: "Idea",
        activeOnly: true,
        description: "Ideas still in play.",
      },
      {
        key: "ideas-all",
        label: "All Ideas",
        title: "Ideas",
        lifecycle: "Idea",
        activeOnly: false,
        description: "Every idea, active and inactive.",
      },
    ],
  },
  {
    lifecycle: "Demand",
    views: [
      {
        key: "demands-active",
        label: "Active Demands",
        title: "Demands",
        lifecycle: "Demand",
        activeOnly: true,
        description: "Demands still in play.",
      },
      {
        key: "demands-all",
        label: "All Demands",
        title: "Demands",
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
        label: "Active Projects",
        title: "Projects",
        lifecycle: "Project",
        activeOnly: true,
        description: "Projects still in play.",
      },
      {
        key: "projects-all",
        label: "All Projects",
        title: "Projects",
        lifecycle: "Project",
        activeOnly: false,
        description: "Every project, active and inactive.",
      },
    ],
  },
];

export const VIEWS: RecordView[] = [
  ...EFFORT_VIEWS,
  ...VIEW_GROUPS.flatMap((g) => g.views),
];

export function viewByKey(key: string): RecordView | undefined {
  return VIEWS.find((v) => v.key === key);
}

/**
 * The same table with no filter: what "All" in the breadcrumb trail opens, and
 * where removing the "Active" step goes. Views are shortcuts onto one table
 * (list view standard 11a), so every active view has an all-rows sibling.
 */
export function allViewFor(view: RecordView): RecordView {
  return VIEWS.find((v) => v.lifecycle === view.lifecycle && !v.activeOnly) ?? view;
}

/** The view's own filter, as breadcrumb steps (before any column searches). */
export function viewSteps(view: RecordView): string[] {
  return view.activeOnly ? ["Active is Yes"] : [];
}
