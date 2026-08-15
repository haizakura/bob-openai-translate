import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

var ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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

function applyLocalization(info, translations) {
  info.name = requireString(translations.name, "name");
  info.summary = requireString(translations.summary, "summary");
  info.appcast = requireString(translations.appcast, "appcast");

  info.options.forEach(function (option) {
    var translation = translations.options && translations.options[option.identifier];
    if (!translation) {
      throw new Error("Missing localization: options." + option.identifier);
    }

    option.title = requireString(translation.title, "options." + option.identifier + ".title");
    option.desc = requireString(translation.desc, "options." + option.identifier + ".desc");
    if (option.textConfig) {
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
        if (typeof menuTranslation.defaultPluginName === "string") {
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
  var translations = readJSON(path.join(ROOT, "src", "locales", locale + ".json"));
  return applyLocalization(info, translations);
}

export { SUPPORTED_LOCALES, loadPluginInfo };
