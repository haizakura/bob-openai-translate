import test from "node:test";
import assert from "node:assert/strict";
import prompts from "../src/modules/prompts.js";

var query = {
  text: "Hello\nworld",
  from: "auto",
  to: "zh-Hans",
  detectFrom: "en",
  detectTo: "zh-Hans"
};

test("translation prompt uses detected language names and keeps text separate", function () {
  var value = prompts.buildPrompt(query, { mode: "translate" });
  assert.match(value.instructions, /English/);
  assert.match(value.instructions, /Simplified Chinese/);
  assert.equal(value.input, query.text);
});

test("polish prompt keeps the detected source language", function () {
  var value = prompts.buildPrompt(query, { mode: "polish" });
  assert.match(value.instructions, /same language/);
  assert.match(value.instructions, /English/);
});

test("custom prompt replaces every supported variable occurrence", function () {
  var value = prompts.buildPrompt(query, {
    mode: "custom",
    systemPrompt: "From $query.detectFromLang to $query.detectToLang",
    userPrompt: "$query.text | $query.text | $query.detectFrom -> $query.detectTo"
  });
  assert.equal(value.instructions, "From English to Simplified Chinese");
  assert.equal(value.input, "Hello\nworld | Hello\nworld | en -> zh-Hans");
});
