"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var pluginInfo = require("../scripts/plugin-info");

test("plugin metadata is generated in one selected language", function () {
  var chinese = pluginInfo.loadPluginInfo("zh-Hans");
  var english = pluginInfo.loadPluginInfo("en");

  assert.equal(chinese.name, "OpenAI 翻译");
  assert.equal(english.name, "OpenAI Translate");
  assert.equal(chinese.homepage, "https://github.com/haizakura/bob-openai-translate");
  assert.match(chinese.appcast, /appcast\.json$/);
  assert.match(english.appcast, /appcast_en\.json$/);
  assert.notEqual(chinese.appcast, english.appcast);
  assert.equal(chinese.options[0].title, "服务模式");
  assert.equal(english.options[0].title, "Mode");
  assert.deepEqual(
    chinese.options.map(function (option) { return option.identifier; }),
    english.options.map(function (option) { return option.identifier; })
  );
});

test("missing or unsupported build locales fail clearly", function () {
  assert.throws(function () {
    pluginInfo.loadPluginInfo("ja");
  }, /Unsupported locale/);
});
