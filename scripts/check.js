"use strict";

var childProcess = require("node:child_process");
var fs = require("node:fs");
var path = require("node:path");
var pluginInfoModule = require("./plugin-info");

var root = path.resolve(__dirname, "..");
var packageInfo = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

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
  var info = pluginInfoModule.loadPluginInfo(locale);
  assert(packageInfo.version === info.version, "package.json and " + locale + " info versions differ");
  assert(/^[a-z0-9.]+$/.test(info.identifier), "Bob plugin identifier is invalid");
  assert(info.category === "translate", "Bob plugin category must be translate");
  assert(info.icon === "124", "Bob built-in icon must be 124");
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

pluginInfoModule.SUPPORTED_LOCALES.forEach(validatePluginInfo);

var jsFiles = [];
function collect(directory) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach(function (entry) {
    var file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collect(file);
    } else if (entry.name.endsWith(".js")) {
      jsFiles.push(file);
    }
  });
}

["src", "scripts", "test"].forEach(function (directory) {
  collect(path.join(root, directory));
});

jsFiles.forEach(function (file) {
  var result = childProcess.spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  assert(result.status === 0, result.stderr || "Syntax check failed: " + file);
});

process.stdout.write(
  "Checked " + pluginInfoModule.SUPPORTED_LOCALES.length + " locales and " + jsFiles.length + " JavaScript files\n"
);
