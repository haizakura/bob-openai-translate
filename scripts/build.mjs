import * as childProcess from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SUPPORTED_LOCALES, loadPluginInfo } from "./plugin-info.mjs";

var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
var source = path.join(root, "src");
var distRoot = path.join(root, "dist");
var releaseRoot = path.join(root, "release");
var packageInfo = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

function selectedLocale(args) {
  var locale = "zh-Hans";
  for (var index = 0; index < args.length; index += 1) {
    if (args[index] === "--locale") {
      locale = args[index + 1];
      index += 1;
    } else if (args[index].indexOf("--locale=") === 0) {
      locale = args[index].slice("--locale=".length);
    } else {
      throw new Error("Unknown build argument: " + args[index]);
    }
  }

  var aliases = {
    zh: "zh-Hans",
    "zh-CN": "zh-Hans",
    cn: "zh-Hans",
    "en-US": "en"
  };
  return aliases[locale] || locale;
}

function buildLocale(locale) {
  var info = loadPluginInfo(locale);
  var debugPlugin = path.join(distRoot, "openai-translate-" + locale + ".bobplugin");
  var archiveName = "openai-translate-" + locale + "-v" + packageInfo.version + ".bobplugin";
  var archivePath = path.join(releaseRoot, archiveName);

  fs.mkdirSync(debugPlugin, { recursive: true });
  fs.copyFileSync(path.join(source, "main.js"), path.join(debugPlugin, "main.js"));
  fs.cpSync(path.join(source, "modules"), path.join(debugPlugin, "modules"), { recursive: true });
  fs.writeFileSync(
    path.join(debugPlugin, "modules", "build-locale.js"),
    '"use strict";\n\nmodule.exports = ' + JSON.stringify(locale) + ";\n"
  );
  fs.copyFileSync(path.join(root, "LICENSE"), path.join(debugPlugin, "LICENSE"));
  fs.writeFileSync(path.join(debugPlugin, "info.json"), JSON.stringify(info, null, 2) + "\n");

  fs.rmSync(archivePath, { force: true });
  var zip = childProcess.spawnSync("zip", ["-q", "-r", archivePath, "."], {
    cwd: debugPlugin,
    encoding: "utf8"
  });
  if (zip.error) {
    throw zip.error;
  }
  if (zip.status !== 0) {
    throw new Error(zip.stderr || "zip failed with status " + zip.status);
  }

  process.stdout.write("Built " + path.relative(root, debugPlugin) + "\n");
  process.stdout.write("Built " + path.relative(root, archivePath) + "\n");
}

var locale = selectedLocale(process.argv.slice(2));
var locales = locale === "all" ? SUPPORTED_LOCALES : [locale];

fs.rmSync(distRoot, { recursive: true, force: true });
fs.mkdirSync(distRoot, { recursive: true });
fs.mkdirSync(releaseRoot, { recursive: true });
// Remove the pre-localization artifact so a stale bilingual build is not installed accidentally.
fs.rmSync(path.join(releaseRoot, "openai-translate-v" + packageInfo.version + ".bobplugin"), { force: true });

locales.forEach(buildLocale);
