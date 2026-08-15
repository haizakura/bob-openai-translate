import * as childProcess from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SUPPORTED_LOCALES, loadPluginInfo } from "./plugin-info.mjs";

var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
var packageInfo = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
var pluginInfoTemplate = fs.readFileSync(path.join(root, "src", "info.json"), "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

var requiredOptions = [
  "mode",
  "apiKey",
  "baseURL",
  "apiPath",
  "model",
  "reasoningEffort",
  "maxOutputTokens",
  "stream",
  "systemPrompt",
  "userPrompt"
];

assert(
  !/[\u3400-\u9fff]/.test(pluginInfoTemplate),
  "Chinese interface copy must be maintained in src/locales/zh-Hans.json"
);

function interfaceStrings(info) {
  var values = [info.name, info.summary];
  info.options.forEach(function (option) {
    values.push(option.title, option.desc);
    if (option.textConfig) {
      values.push(option.textConfig.placeholderText);
    }
    if (Array.isArray(option.menuValues)) {
      option.menuValues.forEach(function (menuValue) {
        values.push(menuValue.title, menuValue.defaultPluginName);
      });
    }
  });
  return values.filter(function (value) {
    return typeof value === "string";
  });
}

function validatePluginInfo(locale) {
  var info = loadPluginInfo(locale);
  assert(packageInfo.version === info.version, "package.json and " + locale + " info versions differ");
  assert(/^[a-z0-9.]+$/.test(info.identifier), "Bob plugin identifier is invalid");
  assert(info.category === "translate", "Bob plugin category must be translate");
  assert(info.icon === "124", "Bob built-in icon must be 124");
  assert(/^https:\/\/github\.com\/haizakura\/bob-openai-translate$/.test(info.homepage), "Plugin homepage is invalid");
  assert(/^https:\/\/raw\.githubusercontent\.com\/haizakura\/bob-openai-translate\/main\/appcast(?:_en)?\.json$/.test(info.appcast), locale + " appcast URL is invalid");
  assert(Array.isArray(info.options), "Bob plugin options are missing");

  var optionIds = info.options.map(function (option) {
    return option.identifier;
  });
  assert(new Set(optionIds).size === optionIds.length, "Bob option identifiers must be unique");
  requiredOptions.forEach(function (identifier) {
    assert(optionIds.indexOf(identifier) >= 0, "Missing Bob option: " + identifier);
  });

  var strings = interfaceStrings(info);
  strings.forEach(function (value) {
    assert(!/\s\/\s/.test(value), locale + " interface contains a bilingual separator: " + value);
  });
  if (locale === "en") {
    strings.forEach(function (value) {
      assert(!/[\u3400-\u9fff]/.test(value), "English interface contains Chinese text: " + value);
    });
  }
}

SUPPORTED_LOCALES.forEach(validatePluginInfo);
assert(
  loadPluginInfo("zh-Hans").appcast !== loadPluginInfo("en").appcast,
  "Localized packages must use different appcasts"
);

var jsFiles = [];
function collect(directory) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach(function (entry) {
    var file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collect(file);
    } else if (entry.name.endsWith(".js") || entry.name.endsWith(".mjs")) {
      jsFiles.push(file);
    }
  });
}

function assertESModuleScripts(directory) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach(function (entry) {
    var file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      assertESModuleScripts(file);
    } else if (entry.name.endsWith(".js")) {
      throw new Error("Build and test scripts must use the .mjs extension: " + file);
    }
  });
}

assertESModuleScripts(path.join(root, "scripts"));
assertESModuleScripts(path.join(root, "test"));

["src", "scripts", "test"].forEach(function (directory) {
  collect(path.join(root, directory));
});

jsFiles.forEach(function (file) {
  var result = childProcess.spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  assert(result.status === 0, result.stderr || "Syntax check failed: " + file);
});

process.stdout.write(
  "Checked " + SUPPORTED_LOCALES.length + " locales and " + jsFiles.length + " JavaScript files\n"
);
