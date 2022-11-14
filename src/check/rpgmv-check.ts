import { trimIndent } from "../../deps.ts";

interface Range {
  getValues(): string[][];
}

interface Sheet {
  getName(): string;
  getRange(a1Notation: string): Range;
}

interface CheckArgs {
  id: string;
  attr: string;
  original: string;
  translate: string;
  sheetName: string;
  sheetRowNumber: number;
}

type CheckFunc = (args: CheckArgs) => string | undefined;

/**
 * 字数が全角 16 文字 (半角 32 文字) を超える場合
 */
export const checkLength: CheckFunc = (
  { translate, sheetName, sheetRowNumber },
) => {
  const lines = translate.split("\n").map((s) => s.replace(/\\(?:SE\[\d+\]|\.)/g, ""));
  const length = Math.max(
    ...lines.map((s) =>
      s
        .split("")
        .map((c) => c.charCodeAt(0))
        .map((i) => (33 <= i && i <= 126 ? 1 : 2))
        .reduce<number>((prev, curr) => prev + curr, 0)
    ),
  );
  if (40 < length) {
    return trimIndent`
      字数が全角 20 文字 (半角 40 文字) を超えています。
      原文: "${translate}" (${sheetName}:${sheetRowNumber})
    `;
  } else if (32 < length) {
    return trimIndent`
      字数が全角 16 文字 (半角 32 文字) を超えています。
      原文: "${translate}" (${sheetName}:${sheetRowNumber})
    `;
  }
};

/**
 * シートに対して全てのチェックをします。
 */
export function checkAll(sheets: Sheet[]): string {
  return sheets
    .reduce<string[]>((errors, sheet) => {
      const sheetName = sheet.getName();
      const e = sheet
        .getRange("A3:F")
        .getValues()
        .reduce<string[]>((errors, [_mapId, id, original, attr, translate], index) => {
          const sheetRowNumber = index + 3;
          const args: CheckArgs = {
            id,
            attr,
            original,
            translate,
            sheetName,
            sheetRowNumber,
          };
          const checkFuncs: CheckFunc[] = [checkLength];
          const e = checkFuncs
            .map((f) => f(args))
            .filter(<T>(r: T | undefined): r is T => Boolean(r));
          return errors.concat(e);
        }, []);
      return errors.concat(e);
    }, [])
    .join("\n\n");
}
