import test from "node:test";
import assert from "node:assert/strict";
import openai from "../src/modules/openai.js";

var config = {
  apiKey: "test-key",
  baseURL: "https://api.openai.com",
  apiPath: "/v1/responses",
  model: "gpt-5.6-luna",
  reasoningEffort: "low",
  verbosity: "low",
  maxOutputTokens: 1234,
  requestTimeout: 60,
  stream: true
};

test("createRequestBody follows the Responses API shape", function () {
  var body = openai.createRequestBody(config, { instructions: "system", input: "user" }, true);
  assert.deepEqual(body, {
    model: "gpt-5.6-luna",
    input: "user",
    max_output_tokens: 1234,
    store: false,
    stream: true,
    instructions: "system",
    reasoning: { effort: "low" },
    text: { verbosity: "low" }
  });
});

test("extractOutputText ignores reasoning items", function () {
  var text = openai.extractOutputText({
    output: [
      { type: "reasoning", content: [] },
      {
        type: "message",
        content: [
          { type: "output_text", text: "Hello" },
          { type: "refusal", refusal: "ignored" },
          { type: "output_text", text: " world" }
        ]
      }
    ]
  });
  assert.equal(text, "Hello world");
});

test("SSE parser handles split Responses API events", function () {
  var events = [];
  var errors = [];
  var parser = openai.createSSEParser(
    function (event) {
      events.push(event);
    },
    function (error) {
      errors.push(error);
    }
  );

  parser.feed('event: response.output_text.delta\ndata: {"type":"response.output_');
  parser.feed('text.delta","delta":"你"}\n\nevent: response.completed\ndata: {"type":"response.completed"}\n\n');
  parser.finish();

  assert.equal(errors.length, 0);
  assert.equal(events.length, 2);
  assert.equal(events[0].delta, "你");
  assert.equal(events[1].type, "response.completed");
});

test("run streams cumulative text and completes", function (_, done) {
  var streamed = [];
  var http = {
    streamRequest: function (options) {
      assert.equal(options.url, "https://api.openai.com/v1/responses");
      assert.equal(options.header.Authorization, "Bearer test-key");
      options.streamHandler({
        text: 'data: {"type":"response.output_text.delta","delta":"你"}\n\n' +
          'data: {"type":"response.output_text.delta","delta":"好"}\n\n'
      });
      options.handler({ response: { statusCode: 200 } });
    }
  };

  openai.run(
    http,
    config,
    { instructions: "translate", input: "hello" },
    {},
    function (text) {
      streamed.push(text);
    },
    function (error, output) {
      assert.equal(error, null);
      assert.deepEqual(streamed, ["你", "你好"]);
      assert.equal(output, "你好");
      done();
    }
  );
});

test("authentication failures become Bob secretKey errors", function () {
  var error = openai.errorFromResponse({
    data: { error: { message: "Incorrect API key" } },
    response: { statusCode: 401 }
  });
  assert.equal(error.type, "secretKey");
  assert.equal(error.message, "Incorrect API key");
});
