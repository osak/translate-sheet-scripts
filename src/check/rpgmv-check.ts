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

const COMMAND_PATTERN = /\\(\.|(\w+)\[[^\]]+\]|{|})/g;

/**
 * 字数が全角 20 文字 (半角 40 文字) を超える場合
 */
export const checkLength: CheckFunc = (
  { original, translate, sheetName, sheetRowNumber },
) => {
  const lines = translate.split("\n").map((s) => s.replace(COMMAND_PATTERN, ""));
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
      1行の文字数が全角 20 文字 (半角 40 文字) を超えています。
      原文: "${original}"
      訳文: "${translate}"
      (${sheetName}:${sheetRowNumber})
    `;
  }
};

function isCommandMatching(command1: RegExpMatchArray, command2: RegExpMatchArray): boolean {
  const name1 = command1[2];
  const name2 = command2[2];

  // フォント指定コマンド：日本語ローカライズに当たってフォントを変更する場合があるので、フォント名の違いは無視する
  if (name1 == "fn" && name2 == "fn") {
    return true;
  }
  return command1[0] == command2[0];
}

/**
 * コマンド列が原文と違う場合
 * 翻訳するとコマンドの順序が変わる可能性があるかもしれないが、そうなったらその時考える
 */
export const checkCommandSequence: CheckFunc = (
  { original, translate, sheetName, sheetRowNumber },
) => {
  // サポートしてるコマンド
  // \.
  // \{
  // \}
  // \c[0], \fn[Doctor Glitch] 等
  const originalCommands = [...original.matchAll(COMMAND_PATTERN)];
  const translateCommands = [...translate.matchAll(COMMAND_PATTERN)];

  for (let i = 0; i < originalCommands.length; ++i) {
    const originalCommand = originalCommands[i];
    const translateCommand = translateCommands[i];
    if (translateCommand == undefined) {
      return trimIndent`
        コマンド数が原文より少なくなっています（含まれている分の順番は一致）。
        原文: "${original}" (${(originalCommand.index || 0) + 1}文字目、期待: ${originalCommand[0]})
        訳文: "${translate}"
        (${sheetName}:${sheetRowNumber})
      `;
    }

    if (!isCommandMatching(originalCommand, translateCommand)) {
      return trimIndent`
        コマンドの順序が原文と異なっています。
        原文: "${original}" (${(originalCommand.index || 0) + 1}文字目、期待: ${originalCommand[0]})
        訳文: "${translate}" (${(translateCommand.index || 0) + 1}文字目、検出: ${translateCommand[0]})
        (${sheetName}:${sheetRowNumber})
      `;
    }
  }

  if (originalCommands.length < translateCommands.length) {
    const translateCommand = translateCommands[originalCommands.length];
    return trimIndent`
        コマンド数が原文より多くなっています（含まれている分の順番は一致）。
        原文: "${original}"
        訳文: "${translate}" (${(translateCommand.index || 0) + 1}文字目、検出: ${translateCommand[0]})
        (${sheetName}:${sheetRowNumber})

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
        .reduce<string[]>((errors, [_mapId, id, attr, original, translate], index) => {
          const sheetRowNumber = index + 3;
          const args: CheckArgs = {
            id,
            attr,
            original,
            translate,
            sheetName,
            sheetRowNumber,
          };
          const checkFuncs: CheckFunc[] = [checkLength, checkCommandSequence];
          const e = checkFuncs
            .map((f) => f(args))
            .filter(<T>(r: T | undefined): r is T => Boolean(r));
          return errors.concat(e);
        }, []);
      return errors.concat(e);
    }, [])
    .join("\n\n");
}
