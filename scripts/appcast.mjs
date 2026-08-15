import * as crypto from "node:crypto";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { SUPPORTED_LOCALES, loadPluginInfo } from "./plugin-info.mjs";

var ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
var RELEASE_ROOT = path.join(ROOT, "release");
var REPOSITORY = "haizakura/bob-openai-translate";
var LOCALE_CONFIG = {
  "zh-Hans": {
    appcastFile: "appcast.json",
    desc: "改进构建脚本、本地化文案与插件运行时模块结构"
  },
  en: {
    appcastFile: "appcast_en.json",
    desc: "Improve build scripts, localization, and the plugin runtime module structure"
  }
};

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function archiveName(locale, version) {
  return "openai-translate-" + locale + "-v" + version + ".bobplugin";
}

function releaseURL(locale, version) {
  return "https://github.com/" + REPOSITORY + "/releases/download/v" + version + "/" + archiveName(locale, version);
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function mergeAppcast(current, identifier, entry) {
  if (current && current.identifier && current.identifier !== identifier) {
    throw new Error("Appcast identifier does not match plugin identifier");
  }
  var previousVersions = current && Array.isArray(current.versions) ? current.versions : [];
  return {
    identifier: identifier,
    versions: [entry].concat(previousVersions.filter(function (version) {
      return version.version !== entry.version;
    }))
  };
}

function createEntry(locale, version, timestamp) {
  var info = loadPluginInfo(locale);
  var archive = path.join(RELEASE_ROOT, archiveName(locale, version));
  if (!fs.existsSync(archive)) {
    throw new Error("Missing release artifact: " + path.relative(ROOT, archive));
  }
  return {
    version: version,
    desc: LOCALE_CONFIG[locale].desc,
    sha256: sha256(archive),
    url: releaseURL(locale, version),
    minBobVersion: info.minBobVersion,
    timestamp: timestamp
  };
}

function updateAppcasts(timestamp) {
  var packageInfo = readJSON(path.join(ROOT, "package.json"));
  var generatedAt = Number.isFinite(timestamp) ? Math.trunc(timestamp) : Date.now();

  SUPPORTED_LOCALES.forEach(function (locale) {
    var info = loadPluginInfo(locale);
    var config = LOCALE_CONFIG[locale];
    var appcastPath = path.join(ROOT, config.appcastFile);
    var current = fs.existsSync(appcastPath) ? readJSON(appcastPath) : null;
    var appcast = mergeAppcast(current, info.identifier, createEntry(locale, packageInfo.version, generatedAt));
    fs.writeFileSync(appcastPath, JSON.stringify(appcast, null, 2) + "\n");
    process.stdout.write("Updated " + config.appcastFile + "\n");
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  updateAppcasts();
}

export { LOCALE_CONFIG, archiveName, mergeAppcast, releaseURL, updateAppcasts };
