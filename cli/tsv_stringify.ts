import { stringify } from "https://deno.land/std@0.162.0/encoding/csv.ts";
import { type Translatable } from "../rpgmv/extract.ts";

export function tsvStringify(translatable: Translatable[]) {
  const records: Record<string, unknown>[] = translatable.map((x) => ({
    ...x,
    original: x.original.replaceAll("\n", "\\n"),
  }));

  return stringify(records, {
    columns: ["fileName", "jqFilter", "original"],
    separator: "\t",
  });
}
