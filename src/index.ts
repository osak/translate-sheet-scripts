/// <reference path="https://raw.githubusercontent.com/proudust/deno-gas-types/main/types/index.d.ts" />

import { getScriptProperties } from "./appscript/scriptProperties.ts";
import {
  initStatisticsSheetModifier,
  initTranslateSheetModifier,
} from "./appscript/sheetModifier.ts";
import * as Contexts from "./generator/context.ts";
import { generateCode } from "./generator/renpy.ts";
import { generateCode as generateJson } from "./generator/json.ts";
import { generateCode as generateTransParserJson } from "./generator/transParserJson.ts";
import * as RenPyCheck from "./check/renpy-check.ts";
import * as RpgMvCheck from "./check/rpgmv-check.ts";
import { updatePullRequest } from "./updatePullRequest.ts";

type WebAppsOutput =
  | GoogleAppsScript.HTML.HtmlOutput
  | GoogleAppsScript.Content.TextOutput;
declare let global: {
  doGet: (e?: GoogleAppsScript.Events.DoGet) => WebAppsOutput;
  doPost: (e?: GoogleAppsScript.Events.DoPost) => WebAppsOutput;
  [key: string]: () => void;
};

/**
 * スプレッドシートを開いたときに実行される関数です。
 * スプレッドシートにメニューバーを追加します。
 */
global.onOpen = () => {
  SpreadsheetApp.getActiveSpreadsheet().addMenu("スクリプト", [
    { name: "翻訳のチェック", functionName: "checkTranslates" },
    null,
    //{ name: "シートの書式再設定（全体）", functionName: "fixSpreadsheet" },
    //{ name: "シートの書式再設定（アクティブのみ）", functionName: "fixActiveSheet" },
    null,
    {
      name: "翻訳ファイルの出力 (Google Drive)",
      functionName: "generateTranslationFile",
    },
    //{ name: "翻訳ファイルの出力 (GitHub)", functionName: "updatePullRequest" },
    //{ name: "翻訳ファイルの出力 (Dry-run)", functionName: "generateDryRun" },
  ]);
};

/**
 * ID や属性、翻訳のチェックを行います。
 */
global.checkTranslates = () => {
  const { notConvertColor, checkMode } = getScriptProperties();
  const checkAll = checkMode === "Ren'Py" ? RenPyCheck.checkAll : RpgMvCheck.checkAll;
  const sheets = SpreadsheetApp.getActive()
    .getSheets()
    .slice(1)
    .filter(
      (s) => (notConvertColor ? notConvertColor != s.getTabColor() : true),
    );
  const msg = checkAll(sheets).replace(/\n/g, "\\n");
  Browser.msgBox(msg);
};

/**
 * 全てのシートのフォーマットを修正します。
 */
global.fixSpreadsheet = () => {
  const prop = getScriptProperties();
  const statisticsModifier = initStatisticsSheetModifier();
  const translateModifier = initTranslateSheetModifier(prop);

  const activeSpreadsheet = SpreadsheetApp.getActive();
  statisticsModifier(activeSpreadsheet.getSheets()[0]);

  activeSpreadsheet
    .getSheets()
    .filter(
      (
        s,
      ) => (prop.notConvertColor ? prop.notConvertColor != s.getTabColor() : true),
    )
    .forEach((s) => translateModifier(s));
};

/**
 * アクティブなシートのフォーマットを修正します。
 */
global.fixActiveSheet = () => {
  const prop = getScriptProperties();

  const activeSheet = SpreadsheetApp.getActive().getActiveSheet();
  const modifier = (() => {
    if (activeSheet.getIndex() === 1) return initStatisticsSheetModifier();
    else return initTranslateSheetModifier(prop);
  })();
  modifier(activeSheet);
};

function GenerateTranslationFile<TReturn>(
  context: Contexts.Context<TReturn>,
): TReturn {
  const { notConvertColor, exportMode } = getScriptProperties();
  const sheets = SpreadsheetApp.getActive()
    .getSheets()
    .slice(1)
    .filter(
      (s) => (notConvertColor ? notConvertColor != s.getTabColor() : true),
    );
  let files;
  if (exportMode.startsWith("Ren'Py")) {
    files = generateCode(sheets, exportMode === "Ren'Py with history support");
  } else if (exportMode == "trans-parser") {
    files = generateTransParserJson(sheets);
  } else {
    files = generateJson(sheets);
  }
  files.forEach((file) => context.addFile(file.name, file.content));
  return context.finish();
}

/**
 * スプレッドシートの翻訳シートから翻訳スクリプトを生成し、ユーザーのドライブに保存します。
 */
global.generateTranslationFile = () => {
  const { folderName } = getScriptProperties();
  const context = new Contexts.DriveContext(folderName, new Date());
  GenerateTranslationFile(context);
};

/**
 * スプレッドシートの翻訳シートから翻訳スクリプトが可能かテストします。
 */
global.generateDryRun = () => GenerateTranslationFile(new Contexts.DryRunContext());

/**
 * GitHub のリポジトリに対し dispatches イベント (type: update_translate) を発火させます。
 * それをトリガーに GitHub Actions 側で翻訳スクリプトを生成します。
 */
global.updatePullRequest = () => updatePullRequest(getScriptProperties());

/**
 * スプレッドシートの翻訳シートから翻訳スクリプトを生成し、Zip 圧縮した Base64 文字列を返す。
 */
global.doGet = () => GenerateTranslationFile(new Contexts.HttpContext());
