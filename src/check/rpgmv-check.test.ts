import { assertEquals } from "../../dev-deps.ts";
import { checkCommandSequence, checkLength } from "./rpgmv-check.ts";

type CheckArgs = Parameters<typeof checkLength>[0];
const toArgs = (obj: Partial<CheckArgs>): CheckArgs => ({
  id: "",
  attr: "",
  original: "",
  translate: "",
  sheetName: "",
  sheetRowNumber: 0,
  ...obj,
});

Deno.test("[checkId] Not error", () => {
  const normal = toArgs({
    translate: "ごめんね！\\.\\.さっきまで裏で\nちょいと仕事してたもんだからさ。",
  });
  assertEquals(checkLength(normal), undefined);
});

Deno.test("[checkId] Not error", () => {
  const normal = toArgs({
    translate: "\\c[1]１２３４５６７８９０１２３４５６７８９０\\c[0]",
  });
  assertEquals(checkLength(normal), undefined);
});

Deno.test("[checkId] Error", () => {
  const normal = toArgs({
    translate: "ごめんね! \\.\\.さっきまで裏でちょいと\n仕事してたもんだからさ。ああああああああああああ",
  });
  assertEquals(!!checkLength(normal), true);
});

Deno.test("[checkCommandSequence] Not error", () => {
  const normal = toArgs({
    original: "lately, all heading \\c[3]south\\c[0] to \\c[3]Caste City\\c[0].",
    translate: "最近、みんな \\c[3]南\\c[0]の \\c[3]Caste City\\c[0] に向かって行くね。",
  });
  assertEquals(checkCommandSequence(normal), undefined);
});

Deno.test("[checkCommandSequence] Font command", () => {
  const normal = toArgs({
    original: "\\fn[Doctor Glitch]\\fz[20]Hello everybody!",
    translate: "\\fn[Genkaimincho]\\fz[20]こんにちは、諸君！",
  });
  assertEquals(checkCommandSequence(normal), undefined);
});

Deno.test("[checkCommandSequence] Error", () => {
  const normal = toArgs({
    original: "lately, all heading \\c[3]south\\c[0] to \\c[3]Caste City\\c[0].",
    translate: "最近、みんな \\c[0]南\\c[3]の \\c[3]Caste City\\c[0] に向かって行くね。",
  });
  assertEquals(!!checkCommandSequence(normal), true);
});
