/// <reference path="https://raw.githubusercontent.com/proudust/deno-gas-types/main/types/index.d.ts" />

/**
 * 未加工のスクリプトのプロパティを表します。
 */
interface RawScriptProperties {
  /** 出力フォルダ名 */
  FOLDER_NAME: string;
  /** タグの名称 (カンマ区切り) */
  TAG_NAMES: string;
  /** タグの色 (カラーコード表記、カンマ区切り) */
  TAG_COLORS: string;
  /** スクリプト出力から除外するシートの色 */
  NOT_CONVERT_COLORS: string;
  /** 出力するデータの種類 (Ren'Py/Ren'Py with history support/JSON) */
  EXPORT_MODE: string;
  /** 翻訳のチェックのモード (Ren'Py/RPGMakerMV) */
  CHECK_MODE: string;
  /** GitHub のリポジトリ名 */
  GITHUB_REPOSITORY: string;
  /** GitHub の Personal access token */
  GITHUB_TOKEN: string;
}

function throwError(string: string): never {
  throw new Error(string);
}

export class ScriptProperties {
  public constructor(
    /** 未加工のスクリプトのプロパティ */
    private raw: Partial<RawScriptProperties>,
  ) {}

  /**
   * 未加工のスクリプトのプロパティから値を取得します。
   * @throws 指定のプロパティが未定義の場合、エラーをスローします。
   */
  private getValue<T extends keyof RawScriptProperties>(
    key: T,
  ): RawScriptProperties[T] {
    return this.raw[key] ??
      throwError(`${key} is not defined in the script property.`);
  }

  /** 出力フォルダ名 */
  public get folderName(): string {
    return this.getValue("FOLDER_NAME");
  }

  /** タグの配列 */
  public get tags(): { name: string; color: string }[] {
    const names = this.getValue("TAG_NAMES").split(",");
    const colors = this.getValue("TAG_COLORS").split(",");
    return names.map((name, index) => ({
      name,
      color: colors[index],
    }));
  }

  /** スクリプト出力から除外するシートの色 */
  public get notConvertColor(): string | undefined {
    return this.raw.NOT_CONVERT_COLORS?.toLowerCase();
  }

  /** 出力するデータの種類 (Ren'Py/Ren'Py with history support/JSON) */
  public get exportMode(): "Ren'Py" | "Ren'Py with history support" | "JSON" | "trans-parser" {
    const mode = this.getValue("EXPORT_MODE");
    if (
      mode !== "Ren'Py" && mode !== "Ren'Py with history support" &&
      mode !== "JSON" && mode !== "trans-parser"
    ) {
      throw new Error(`${mode} is invalid export mode.`);
    }
    return mode;
  }

  /** 翻訳のチェックのモード (Ren'Py/RPGMakerMV) */
  public get checkMode(): "Ren'Py" | "RPGMakerMV" {
    const mode = this.getValue("CHECK_MODE");
    if (mode !== "Ren'Py" && mode !== "RPGMakerMV") {
      throw new Error(`${mode} is invalid check mode.`);
    }
    return mode;
  }

  /** GitHub のリポジトリ名 */
  public get githubRepository(): string {
    return this.getValue("GITHUB_REPOSITORY");
  }

  /** GitHub の Personal access token */
  public get githubToken(): string {
    return this.getValue("GITHUB_TOKEN");
  }
}

export function getScriptProperties(): ScriptProperties {
  const raw: Partial<RawScriptProperties> = PropertiesService
    .getScriptProperties().getProperties();
  return new ScriptProperties(raw);
}
