interface Sheet {
  getName(): string;
  getRange(a1Notation: string): Range;
}

interface Range {
  getValues(): string[][];
}

interface File {
  name: string;
  content: string;
}

interface TranslationMap {
  [fileName: string]: {
    [context: string]: string;
  };
}

export function readRow(
  translations: TranslationMap,
  [fileName, context, _, original, translation]: string[],
): TranslationMap {
  if (fileName && context && original && translation && original !== translation) {
    if (!(fileName in translations)) {
      translations[fileName] = {};
    }
    translations[fileName][context] = translation;
  }
  return translations;
}

export function generateCode(sheets: Sheet[]): File[] {
  const translations = sheets.reduce<TranslationMap>(
    (t, s) => s.getRange("A2:E").getValues().reduce<TranslationMap>(readRow, t),
    {},
  );
  const content = JSON.stringify(translations, null, 4) + "\n";
  return [{ name: "translation.json", content }];
}
