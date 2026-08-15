"use strict";

var configModule = require("./config.js");
var i18n = require("./i18n.js");
var languages = require("./languages.js");
var openai = require("./openai.js");
var prompts = require("./prompts.js");

var API_KEY_HELP = "https://platform.openai.com/api-keys";

function supportLanguages() {
  return languages.supportLanguages();
}

function pluginTimeoutInterval(options) {
  return configModule.clampTimeout((options || {}).requestTimeout);
}

function callbackFor(query, legacyCompletion) {
  if (query && typeof query.onCompletion === "function") {
    return query.onCompletion;
  }
  return legacyCompletion;
}

function translationResult(query, config, output) {
  var from = query.detectFrom || query.detectFromLang || query.from;
  var to = query.detectTo || query.detectToLang || query.to;
  if (config.mode === "polish") {
    to = from;
  }
  return {
    from: from,
    to: to,
    // Keeping the complete text as one item preserves model formatting in Bob.
    toParagraphs: [output]
  };
}

function configError(error) {
  return openai.serviceError("param", error.message || String(error));
}

function missingKeyError() {
  return {
    type: "secretKey",
    message: i18n.t("apiKeyRequired"),
    troubleshootingLink: API_KEY_HELP
  };
}

function translate(http, options, query, legacyCompletion) {
  var completion = callbackFor(query, legacyCompletion);
  if (typeof completion !== "function") {
    return;
  }

  var config;
  var prompt;
  try {
    config = configModule.readConfig(options || {});
    if (!config.apiKey) {
      completion({ error: missingKeyError() });
      return;
    }
    prompt = prompts.buildPrompt(query, config);
  } catch (error) {
    completion({ error: configError(error) });
    return;
  }

  openai.run(
    http,
    config,
    prompt,
    query,
    function (output) {
      if (query && typeof query.onStream === "function") {
        query.onStream(translationResult(query, config, output));
      }
    },
    function (error, output) {
      if (error) {
        completion({ error: error });
        return;
      }
      completion({ result: translationResult(query, config, output) });
    }
  );
}

function pluginValidate(http, options, completion) {
  var config;
  try {
    config = configModule.readConfig(options || {});
  } catch (error) {
    completion({ result: false, error: configError(error) });
    return;
  }

  if (!config.apiKey) {
    completion({ result: false, error: missingKeyError() });
    return;
  }

  var validationConfig = Object.assign({}, config, {
    stream: false,
    maxOutputTokens: 256,
    reasoningEffort: "auto",
    verbosity: "auto"
  });
  openai.run(
    http,
    validationConfig,
    { instructions: "Return exactly OK.", input: "Connection test" },
    null,
    function () {},
    function (error) {
      if (error) {
        error.troubleshootingLink = API_KEY_HELP;
        completion({ result: false, error: error });
        return;
      }
      completion({ result: true });
    }
  );
}

module.exports = {
  callbackFor: callbackFor,
  pluginTimeoutInterval: pluginTimeoutInterval,
  pluginValidate: pluginValidate,
  supportLanguages: supportLanguages,
  translate: translate,
  translationResult: translationResult
};
