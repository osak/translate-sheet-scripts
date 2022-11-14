import { parse } from "https://deno.land/std@0.162.0/flags/mod.ts";
import { join } from "https://deno.land/std@0.162.0/path/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.4/ansi/mod.ts";
import { build } from "https://deno.land/x/esbuild@v0.15.13/mod.js";
import httpPlugin from "https://deno.land/x/esbuild_plugin_http_fetch@v1.0.3/index.js";
import { $, cd, ProcessOutput } from "https://deno.land/x/zx_deno@1.2.2/mod.mjs";
import gasPlugin from "https://esm.sh/esbuild-gas-plugin@0.5.0/mod.ts";
// 今のとこいらないのでコメントアウト
// import { ghDescribe } from "https://raw.githubusercontent.com/proudust/gh-describe/v1.5.1/core/mod.ts";

const profiles = {
  "main": {
    name: "Main script",
    scriptId: "",
  },
} as const;

async function generateVersionTs() {
  // const { describe } = await ghDescribe({ defaultTag: "0.0.0" });
  const describe = "v0.0.1";
  await Deno.writeTextFile("version.ts", `export const version = "${describe}";\n`);
}

async function _cliBuild() {
  const targets = [
    "x86_64-unknown-linux-gnu",
    "x86_64-pc-windows-msvc",
    "x86_64-apple-darwin",
    "aarch64-apple-darwin",
  ];

  return await Promise.all(targets.map(async (target) => {
    const dist = join("dist", `cli-${target}`);
    await Deno.mkdir(dist, { recursive: true });
    $.verbose = false;
    try {
      await $`
        deno compile \
          --allow-read \
          --allow-write \
          --output ${dist}/extract \
          --target ${target} \
          cli/cli.ts
      `;
      console.log(colors.bold.green("✓"), " ", "CLI", target);
    } catch (e: unknown) {
      if (e instanceof ProcessOutput) {
        console.error(e.stderr);
      }
      throw e;
    }
  }));
}

async function gasBuild(dist: string, name: string) {
  const bundleTask = build({
    bundle: true,
    charset: "utf8",
    entryPoints: ["src/index.ts"],
    outfile: join(dist, "out.js"),
    target: "es2017", // Workaround for jquery/esprima#2034
    plugins: [
      httpPlugin,
      gasPlugin,
    ],
  });
  const copyTask = async (): Promise<void> => {
    await Deno.mkdir(dist, { recursive: true });
    await Deno.copyFile("src/appsscript.json", join(dist, "appsscript.json"));
  };
  await Promise.all([bundleTask, copyTask()]);
  console.log(colors.bold.green("✓"), " ", name);
}

async function gasDeploy(source: string, name: string, scriptId: string) {
  await Deno.writeTextFile(join(source, ".clasp.json"), JSON.stringify({ scriptId }));
  $.verbose = false;
  cd(source);
  await $`npx clasp push -f`;
  console.log(colors.bold.green("✓"), " ", name);
}

const args = parse(Deno.args, {});

switch (args._[0] || "build") {
  case "build": {
    await generateVersionTs();
    await Promise.all([
      //cliBuild(),
      ...Object.entries(profiles).map(async ([id, { name }]) => {
        const dist = join("dist", `gas-${id}`);
        await gasBuild(dist, name);
      }),
    ]);
    break;
  }
  case "deploy": {
    await Promise.all(
      Object.entries(profiles).map(async ([id, { name, scriptId }]) => {
        const dist = join("dist", `gas-${id}`);
        await gasDeploy(dist, name, scriptId);
      }),
    );
    break;
  }
}

Deno.exit(0);
