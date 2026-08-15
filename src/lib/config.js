"use strict";

var i18n = require("./i18n");

var DEFAULTS = {
  mode: "translate",
  baseURL: "https://api.openai.com",
  apiPath: "/v1/responses",
  model: "gpt-5.6-luna",
  reasoningEffort: "none",
  verbosity: "auto",
  maxOutputTokens: 4096,
  stream: true,
  requestTimeout: 60,
  systemPrompt: "",
  userPrompt: "$query.text"
};

var MODES = ["translate", "polish", "custom"];
var REASONING_EFFORTS = ["auto", "none", "minimal", "low", "medium", "high", "xhigh", "max"];
var VERBOSITIES = ["auto", "low", "medium", "high"];

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function oneOf(value, allowed, fallback) {
  return allowed.indexOf(value) >= 0 ? value : fallback;
}

function positiveInteger(value, fallback) {
  var parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function clampTimeout(value) {
  var parsed = positiveInteger(value, DEFAULTS.requestTimeout);
  return Math.max(30, Math.min(300, parsed));
}

function normalizeBaseURL(value) {
  var url = text(value) || DEFAULTS.baseURL;
  while (url.length > 0 && url.charAt(url.length - 1) === "/") {
    url = url.slice(0, -1);
  }
  if (!/^https?:\/\/[^\s]+$/i.test(url)) {
    throw new Error(i18n.t("invalidBaseURL"));
  }
  return url;
}

function normalizePath(value) {
  var path = text(value) || DEFAULTS.apiPath;
  if (path.charAt(0) !== "/") {
    path = "/" + path;
  }
  if (path.indexOf("?") >= 0 || path.indexOf("#") >= 0 || /\s/.test(path)) {
    throw new Error(i18n.t("invalidApiPath"));
  }
  return path;
}

function readConfig(options) {
  options = options || {};

  var selectedModel = text(options.model) || DEFAULTS.model;
  var model = selectedModel === "custom" ? text(options.customModel) : selectedModel;

  if (!model) {
    throw new Error(i18n.t("missingCustomModel"));
  }

  return {
    mode: oneOf(text(options.mode), MODES, DEFAULTS.mode),
    apiKey: text(options.apiKey),
    baseURL: normalizeBaseURL(options.baseURL),
    apiPath: normalizePath(options.apiPath),
    model: model,
    reasoningEffort: oneOf(text(options.reasoningEffort), REASONING_EFFORTS, DEFAULTS.reasoningEffort),
    verbosity: oneOf(text(options.verbosity), VERBOSITIES, DEFAULTS.verbosity),
    maxOutputTokens: positiveInteger(options.maxOutputTokens, DEFAULTS.maxOutputTokens),
    stream: text(options.stream) !== "disabled",
    requestTimeout: clampTimeout(options.requestTimeout),
    systemPrompt: typeof options.systemPrompt === "string" ? options.systemPrompt : DEFAULTS.systemPrompt,
    userPrompt: typeof options.userPrompt === "string" ? options.userPrompt : DEFAULTS.userPrompt
  };
}

module.exports = {
  DEFAULTS: DEFAULTS,
  clampTimeout: clampTimeout,
  normalizeBaseURL: normalizeBaseURL,
  normalizePath: normalizePath,
  readConfig: readConfig
};
