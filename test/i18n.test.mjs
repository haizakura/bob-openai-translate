import test from "node:test";
import assert from "node:assert/strict";
import i18n from "../src/modules/i18n.js";

test("runtime messages use exactly one selected language", function () {
  assert.equal(i18n.translate("zh-Hans", "apiKeyRequired"), "请先填写 OpenAI API 密钥");
  assert.equal(i18n.translate("en", "apiKeyRequired"), "Enter your OpenAI API Key first");
  assert.equal(i18n.translate("en", "apiHTTPError", { status: 429 }), "OpenAI API returned HTTP 429");
});
