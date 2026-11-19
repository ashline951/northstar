import { RECORDS_LIST } from "./registry";
import { wireColumns, type ListDef } from "./types";

/**
 * The registry's shape without its value() functions, so a Client Component
 * can build URLs and describe filters. The functions cannot cross the
 * server/client boundary, and the rows never need to: the server has already
 * turned every cell into text.
 */
export const RECORDS_LIST_WIRE = {
  id: RECORDS_LIST.id,
  noun: RECORDS_LIST.noun,
  defaultSort: RECORDS_LIST.defaultSort,
  columns: wireColumns(RECORDS_LIST).map((c) => ({
    ...c,
    value: () => "",
  })),
} as unknown as ListDef<never>;
