"use strict";

var buildLocale = require("./build-locale");

var MESSAGES = {
  "zh-Hans": {
    invalidBaseURL: "API 基础 URL 必须是有效的 HTTP(S) 地址",
    invalidApiPath: "API 路径不能包含查询参数、片段或空格",
    missingCustomModel: "请填写自定义模型名称",
    emptyText: "待处理文本不能为空",
    networkFailed: "网络请求失败",
    apiHTTPError: "OpenAI API 返回 HTTP {status}",
    apiFailed: "OpenAI API 请求失败",
    apiNoText: "OpenAI API 未返回文本",
    streamParseFailed: "无法解析 OpenAI 流式响应",
    apiKeyRequired: "请先填写 OpenAI API 密钥"
  },
  en: {
    invalidBaseURL: "API Base URL must be a valid HTTP(S) URL",
    invalidApiPath: "API Path cannot contain a query, fragment, or spaces",
    missingCustomModel: "Enter a custom model ID",
    emptyText: "Text cannot be empty",
    networkFailed: "Network request failed",
    apiHTTPError: "OpenAI API returned HTTP {status}",
    apiFailed: "OpenAI API request failed",
    apiNoText: "OpenAI API returned no text",
    streamParseFailed: "Failed to parse the OpenAI stream",
    apiKeyRequired: "Enter your OpenAI API Key first"
  }
};

function translate(locale, key, values) {
  var dictionary = MESSAGES[locale] || MESSAGES["zh-Hans"];
  var message = dictionary[key] || MESSAGES["zh-Hans"][key] || key;
  Object.keys(values || {}).forEach(function (name) {
    message = message.split("{" + name + "}").join(String(values[name]));
  });
  return message;
}

function t(key, values) {
  return translate(buildLocale, key, values);
}

module.exports = {
  locale: buildLocale,
  t: t,
  translate: translate
};
