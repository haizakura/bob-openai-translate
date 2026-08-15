"use strict";

var fs = require("node:fs");
var path = require("node:path");

var ROOT = path.resolve(__dirname, "..");
var SUPPORTED_LOCALES = ["zh-Hans", "en"];

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function requireString(value, pathName) {
  if (typeof value !== "string" || !value) {
    throw new Error("Missing localization: " + pathName);
  }
  return value;
}

function applyEnglish(info, translations) {
  info.name = requireString(translations.name, "name");
  info.summary = requireString(translations.summary, "summary");
  info.appcast = requireString(translations.appcast, "appcast");

  info.options.forEach(function (option) {
    var translation = translations.options && translations.options[option.identifier];
    if (!translation) {
      throw new Error("Missing localization: options." + option.identifier);
    }

    option.title = requireString(translation.title, "options." + option.identifier + ".title");
    if (typeof option.desc === "string") {
      option.desc = requireString(translation.desc, "options." + option.identifier + ".desc");
    }
    if (option.textConfig && typeof option.textConfig.placeholderText === "string") {
      option.textConfig.placeholderText = requireString(
        translation.placeholderText,
        "options." + option.identifier + ".placeholderText"
      );
    }
    if (Array.isArray(option.menuValues)) {
      option.menuValues.forEach(function (menuValue) {
        var menuTranslation = translation.menuValues && translation.menuValues[menuValue.value];
        if (!menuTranslation) {
          throw new Error("Missing localization: options." + option.identifier + ".menuValues." + menuValue.value);
        }
        menuValue.title = requireString(
          menuTranslation.title,
          "options." + option.identifier + ".menuValues." + menuValue.value + ".title"
        );
        if (typeof menuValue.defaultPluginName === "string") {
          menuValue.defaultPluginName = requireString(
            menuTranslation.defaultPluginName,
            "options." + option.identifier + ".menuValues." + menuValue.value + ".defaultPluginName"
          );
        }
      });
    }
  });

  return info;
}

function loadPluginInfo(locale) {
  if (SUPPORTED_LOCALES.indexOf(locale) < 0) {
    throw new Error("Unsupported locale: " + locale + ". Use zh-Hans or en.");
  }

  var info = clone(readJSON(path.join(ROOT, "src", "info.json")));
  if (locale === "en") {
    var translations = readJSON(path.join(ROOT, "src", "locales", "en.json"));
    return applyEnglish(info, translations);
  }
  return info;
}

module.exports = {
  SUPPORTED_LOCALES: SUPPORTED_LOCALES,
  loadPluginInfo: loadPluginInfo
};
