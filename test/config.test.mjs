import test from "node:test";
import assert from "node:assert/strict";
import config from "../src/modules/config.js";

test("readConfig provides Responses API defaults", function () {
  var value = config.readConfig({});
  assert.equal(value.baseURL, "https://api.openai.com");
  assert.equal(value.apiPath, "/v1/responses");
  assert.equal(value.model, "gpt-5.6-luna");
  assert.equal(value.reasoningEffort, "none");
  assert.equal(value.maxOutputTokens, 4096);
  assert.equal(value.stream, true);
});

test("readConfig accepts a custom model and normalizes URL parts", function () {
  var value = config.readConfig({
    model: "custom",
    customModel: "my-model",
    baseURL: "https://example.test///",
    apiPath: "custom/responses",
    maxOutputTokens: "8192",
    requestTimeout: "500",
    stream: "disabled"
  });
  assert.equal(value.model, "my-model");
  assert.equal(value.baseURL, "https://example.test");
  assert.equal(value.apiPath, "/custom/responses");
  assert.equal(value.maxOutputTokens, 8192);
  assert.equal(value.requestTimeout, 300);
  assert.equal(value.stream, false);
});

test("readConfig rejects missing custom models and invalid URLs", function () {
  assert.throws(function () {
    config.readConfig({ model: "custom" });
  }, /自定义模型/);
  assert.throws(function () {
    config.readConfig({ baseURL: "file:///tmp/api" });
  }, /HTTP\(S\)/);
});
