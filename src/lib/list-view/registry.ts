import type { NorthstarRecord } from "../records";
import { displayNumber } from "../records";
import type { ListDef } from "./types";

/**
 * Every list's columns live here. Adding a list is an entry in this file, not
 * a new table component - docs/standards/list-view.md.
 *
 * `value` returns the words people see, because searching, sorting and CSV all
 * work on that text. A column that returned a database code would make
 * "contains EMER" fail for the person who typed what was on screen.
 */
export const RECORDS_LIST: ListDef<NorthstarRecord> = {
  id: "records",
  noun: "records",
  defaultSort: { key: "updated", dir: "desc" },
  columns: [
    {
      key: "number",
      label: "Number",
      type: "text",
      width: "9rem",
      value: (r) => displayNumber(r),
    },
    { key: "title", label: "Title", type: "text", value: (r) => r.title },
    {
      key: "lifecycle",
      label: "Lifecycle",
      type: "choice",
      width: "7rem",
      value: (r) => r.lifecycle,
    },
    {
      key: "state",
      label: "State",
      type: "choice",
      width: "9rem",
      value: (r) => r.state,
    },
    {
      key: "assigned_to",
      // A named member of staff. Section 14.4: a person identifier never
      // reaches the AI - it can group by Assignment group instead, which
      // answers the same questions without naming anyone.
      private: true,
      label: "Assigned to",
      type: "text",
      width: "13rem",
      value: (r) => r.assigned_to ?? "",
    },
    {
      key: "assigned_group",
      label: "Assignment group",
      type: "text",
      width: "15rem",
      value: (r) => r.assigned_group ?? "",
    },
    {
      key: "active",
      label: "Active",
      type: "choice",
      width: "6rem",
      value: (r) => (r.is_active ? "Yes" : "No"),
    },
    {
      key: "updated",
      label: "Updated",
      type: "date",
      width: "12rem",
      value: (r) => r.updated_at,
    },
  ],
};
