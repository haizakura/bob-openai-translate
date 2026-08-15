"use strict";

var languages = require("./languages");
var i18n = require("./i18n");

function queryValue(query, primary, legacy, fallback) {
  if (query && typeof query[primary] === "string" && query[primary]) {
    return query[primary];
  }
  if (query && typeof query[legacy] === "string" && query[legacy]) {
    return query[legacy];
  }
  return fallback;
}

function contextFromQuery(query) {
  query = query || {};
  var fromCode = queryValue(query, "detectFrom", "detectFromLang", query.from || "auto");
  var toCode = queryValue(query, "detectTo", "detectToLang", query.to || "auto");

  return {
    text: typeof query.text === "string" ? query.text : "",
    fromCode: fromCode,
    toCode: toCode,
    fromLanguage: languages.languageName(fromCode),
    toLanguage: languages.languageName(toCode)
  };
}

function replaceAll(source, token, value) {
  return source.split(token).join(value);
}

function renderTemplate(template, context) {
  var rendered = typeof template === "string" ? template : "";
  var replacements = {
    "$query.text": context.text,
    "$query.detectFromLang": context.fromLanguage,
    "$query.detectToLang": context.toLanguage,
    "$query.detectFrom": context.fromCode,
    "$query.detectTo": context.toCode,
    "$query.from": context.fromCode,
    "$query.to": context.toCode
  };

  Object.keys(replacements).forEach(function (token) {
    rendered = replaceAll(rendered, token, replacements[token]);
  });

  return rendered;
}

function translationPrompt(context) {
  return {
    instructions: [
      "You are a professional translation engine.",
      "Translate the user's text from " + context.fromLanguage + " to " + context.toLanguage + ".",
      "Preserve the original meaning, tone, terminology, line breaks, and formatting.",
      "Do not explain, annotate, quote, or wrap the translation. Output only the translated text."
    ].join(" "),
    input: context.text
  };
}

function polishPrompt(context) {
  return {
    instructions: [
      "You are a professional editor.",
      "Polish the user's " + context.fromLanguage + " text while keeping it in the same language.",
      "Improve clarity, grammar, fluency, and style without changing meaning, facts, tone, line breaks, or formatting.",
      "Do not explain, annotate, quote, or wrap the result. Output only the polished text."
    ].join(" "),
    input: context.text
  };
}

function customPrompt(context, config) {
  var inputTemplate = config.userPrompt || "$query.text";
  return {
    instructions: renderTemplate(config.systemPrompt, context),
    input: renderTemplate(inputTemplate, context) || context.text
  };
}

function buildPrompt(query, config) {
  var context = contextFromQuery(query);
  if (!context.text) {
    throw new Error(i18n.t("emptyText"));
  }

  if (config.mode === "polish") {
    return polishPrompt(context);
  }
  if (config.mode === "custom") {
    return customPrompt(context, config);
  }
  return translationPrompt(context);
}

module.exports = {
  buildPrompt: buildPrompt,
  contextFromQuery: contextFromQuery,
  renderTemplate: renderTemplate
};
