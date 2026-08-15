"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var main = require("../src/main");

test("Bob entry points expose common languages", function () {
  var supported = main.supportLanguages();
  ["auto", "zh-Hans", "zh-Hant", "en", "ja", "ko"].forEach(function (language) {
    assert.ok(supported.includes(language));
  });
});

test("translationResult preserves formatting and mode language semantics", function () {
  var query = { detectFrom: "en", detectTo: "zh-Hans" };
  assert.deepEqual(main.translationResult(query, { mode: "translate" }, "a\n\nb"), {
    from: "en",
    to: "zh-Hans",
    toParagraphs: ["a\n\nb"]
  });
  assert.equal(main.translationResult(query, { mode: "polish" }, "text").to, "en");
});

test("translate integrates Bob globals, streams, and completes", function (_, done) {
  global.$option = {
    apiKey: "test-key",
    stream: "enabled",
    model: "gpt-5.6-luna"
  };
  global.$http = {
    streamRequest: function (options) {
      assert.equal(options.body.store, false);
      assert.equal(options.body.stream, true);
      options.streamHandler({
        text: 'data: {"type":"response.output_text.delta","delta":"你好"}\n\n'
      });
      options.handler({ response: { statusCode: 200 } });
    }
  };

  var streamResult;
  main.translate({
    text: "Hello",
    from: "auto",
    to: "zh-Hans",
    detectFrom: "en",
    detectTo: "zh-Hans",
    onStream: function (result) {
      streamResult = result;
    },
    onCompletion: function (value) {
      try {
        assert.equal(streamResult.toParagraphs[0], "你好");
        assert.equal(value.result.toParagraphs[0], "你好");
        assert.equal(value.result.from, "en");
        assert.equal(value.result.to, "zh-Hans");
        delete global.$option;
        delete global.$http;
        done();
      } catch (error) {
        done(error);
      }
    }
  });
});
