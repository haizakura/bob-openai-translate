import test from "node:test";
import assert from "node:assert/strict";
import service from "../src/modules/service.js";

test("translationResult preserves formatting and mode language semantics", function () {
  var query = { detectFrom: "en", detectTo: "zh-Hans" };
  assert.deepEqual(service.translationResult(query, { mode: "translate" }, "a\n\nb"), {
    from: "en",
    to: "zh-Hans",
    toParagraphs: ["a\n\nb"]
  });
  assert.equal(service.translationResult(query, { mode: "polish" }, "text").to, "en");
});

test("service selects the Bob completion callback and clamps timeout", function () {
  var queryCompletion = function () {};
  var legacyCompletion = function () {};
  assert.equal(service.callbackFor({ onCompletion: queryCompletion }, legacyCompletion), queryCompletion);
  assert.equal(service.callbackFor({}, legacyCompletion), legacyCompletion);
  assert.equal(service.pluginTimeoutInterval({ requestTimeout: "500" }), 300);
});
