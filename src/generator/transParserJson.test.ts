import { assertEquals } from "../../dev-deps.ts";
import { readRow } from "./transParserJson.ts";

Deno.test("[readRow] single row", () => {
  assertEquals(
    readRow({}, [
      "YAML/Map002.yaml",
      "Map002/events/3/pages/0/list/list/0/message/noPicture/bottom",
      '["",0,0,2]',
      "Hello",
      "こんにちは",
    ]),
    {
      "YAML/Map002.yaml": {
        "Map002/events/3/pages/0/list/list/0/message/noPicture/bottom": "こんにちは",
      },
    },
  );
});

Deno.test("[readRow] multiple rows from the same file", () => {
  const res1 = readRow({}, [
    "YAML/Map002.yaml",
    "Map002/events/3/pages/0/list/list/0/message/noPicture/bottom",
    '["",0,0,2]',
    "Hello",
    "こんにちは",
  ]);
  const res2 = readRow(res1, [
    "YAML/Map002.yaml",
    "Map002/events/5/pages/0/list/list/0/message/noPicture/bottom",
    '["",0,0,2]',
    "Good bye",
    "さようなら",
  ]);
  assertEquals(
    res2,
    {
      "YAML/Map002.yaml": {
        "Map002/events/3/pages/0/list/list/0/message/noPicture/bottom": "こんにちは",
        "Map002/events/5/pages/0/list/list/0/message/noPicture/bottom": "さようなら",
      },
    },
  );
});

Deno.test("[readRow] multiple files", () => {
  const res1 = readRow({}, [
    "YAML/Map002.yaml",
    "Map002/events/3/pages/0/list/list/0/message/noPicture/bottom",
    '["",0,0,2]',
    "Hello",
    "こんにちは",
  ]);
  const res2 = readRow(res1, [
    "YAML/Map003.yaml",
    "Map003/events/5/pages/0/list/list/0/message/noPicture/bottom",
    '["",0,0,2]',
    "Good bye",
    "さようなら",
  ]);
  assertEquals(
    res2,
    {
      "YAML/Map002.yaml": {
        "Map002/events/3/pages/0/list/list/0/message/noPicture/bottom": "こんにちは",
      },
      "YAML/Map003.yaml": {
        "Map003/events/5/pages/0/list/list/0/message/noPicture/bottom": "さようなら",
      },
    },
  );
});
