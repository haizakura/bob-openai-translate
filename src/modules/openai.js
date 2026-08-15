"use strict";

var i18n = require("./i18n.js");

function createRequestBody(config, prompt, stream) {
  var body = {
    model: config.model,
    input: prompt.input,
    max_output_tokens: config.maxOutputTokens,
    store: false,
    stream: Boolean(stream)
  };

  if (prompt.instructions) {
    body.instructions = prompt.instructions;
  }
  if (config.reasoningEffort !== "auto") {
    body.reasoning = { effort: config.reasoningEffort };
  }
  if (config.verbosity !== "auto") {
    body.text = { verbosity: config.verbosity };
  }

  return body;
}

function extractOutputText(data) {
  if (!data || typeof data !== "object") {
    return "";
  }
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  var parts = [];
  var output = Array.isArray(data.output) ? data.output : [];
  output.forEach(function (item) {
    if (!item || item.type !== "message" || !Array.isArray(item.content)) {
      return;
    }
    item.content.forEach(function (content) {
      if (content && content.type === "output_text" && typeof content.text === "string") {
        parts.push(content.text);
      }
    });
  });
  return parts.join("");
}

function apiMessage(data, fallback) {
  if (data && data.error) {
    if (typeof data.error === "string") {
      return data.error;
    }
    if (typeof data.error.message === "string") {
      return data.error.message;
    }
  }
  if (data && typeof data.message === "string") {
    return data.message;
  }
  return fallback;
}

function serviceError(type, message, addition) {
  var error = { type: type, message: message };
  if (addition !== undefined) {
    error.addition = addition;
  }
  return error;
}

function responseStatus(resp) {
  return resp && resp.response && Number(resp.response.statusCode) ? Number(resp.response.statusCode) : 0;
}

function networkMessage(resp) {
  if (!resp || !resp.error) {
    return i18n.t("networkFailed");
  }
  return resp.error.message || resp.error.localizedDescription || i18n.t("networkFailed");
}

function errorFromResponse(resp, streamedError) {
  var status = responseStatus(resp);
  var data = resp && resp.data;

  if (resp && resp.error) {
    return serviceError("network", networkMessage(resp), { statusCode: status || undefined });
  }

  var message = apiMessage(
    streamedError || data,
    status ? i18n.t("apiHTTPError", { status: status }) : i18n.t("apiFailed")
  );

  if (status === 401 || status === 403) {
    return serviceError("secretKey", message, { statusCode: status });
  }
  if (status >= 400) {
    return serviceError("network", message, { statusCode: status });
  }
  return serviceError("api", message);
}

function parseSSEBlock(block) {
  var dataLines = [];
  block.split("\n").forEach(function (line) {
    if (line.indexOf("data:") === 0) {
      dataLines.push(line.slice(5).trimStart());
    }
  });

  var data = dataLines.join("\n");
  if (!data || data === "[DONE]") {
    return null;
  }
  return JSON.parse(data);
}

function createSSEParser(onEvent, onParseError) {
  var buffer = "";

  function process(flush) {
    buffer = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var separator = buffer.indexOf("\n\n");
    while (separator >= 0) {
      var block = buffer.slice(0, separator);
      buffer = buffer.slice(separator + 2);
      if (block.trim()) {
        try {
          var event = parseSSEBlock(block);
          if (event) {
            onEvent(event);
          }
        } catch (error) {
          onParseError(error, block);
        }
      }
      separator = buffer.indexOf("\n\n");
    }

    if (flush && buffer.trim()) {
      try {
        var finalEvent = parseSSEBlock(buffer);
        if (finalEvent) {
          onEvent(finalEvent);
        }
      } catch (error) {
        onParseError(error, buffer);
      }
      buffer = "";
    }
  }

  return {
    feed: function (chunk) {
      buffer += typeof chunk === "string" ? chunk : "";
      process(false);
    },
    finish: function () {
      process(true);
    }
  };
}

function headers(config, stream) {
  var value = {
    Authorization: "Bearer " + config.apiKey,
    "Content-Type": "application/json"
  };
  if (stream) {
    value.Accept = "text/event-stream";
  }
  return value;
}

function requestOptions(config, prompt, query, stream) {
  var options = {
    method: "POST",
    url: config.baseURL + config.apiPath,
    header: headers(config, stream),
    body: createRequestBody(config, prompt, stream),
    timeout: config.requestTimeout
  };
  if (query && query.cancelSignal) {
    options.cancelSignal = query.cancelSignal;
  }
  return options;
}

function requestOnce(http, config, prompt, query, callback) {
  var options = requestOptions(config, prompt, query, false);
  options.handler = function (resp) {
    var status = responseStatus(resp);
    if (resp.error || status < 200 || status >= 300) {
      callback(errorFromResponse(resp));
      return;
    }
    var output = extractOutputText(resp.data);
    if (!output) {
      callback(serviceError("api", i18n.t("apiNoText")));
      return;
    }
    callback(null, output);
  };
  http.request(options);
}

function requestStream(http, config, prompt, query, onText, callback) {
  var output = "";
  var completedOutput = "";
  var streamedError = null;
  var parseError = null;

  var parser = createSSEParser(
    function (event) {
      if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
        output += event.delta;
        onText(output);
      } else if (event.type === "response.completed" && event.response) {
        completedOutput = extractOutputText(event.response);
      } else if (event.type === "response.failed" || event.type === "response.incomplete" || event.type === "error") {
        streamedError = event.response && event.response.error ? event.response : event;
      }
    },
    function (error) {
      parseError = error;
    }
  );

  var options = requestOptions(config, prompt, query, true);
  options.streamHandler = function (stream) {
    parser.feed(stream && stream.text);
  };
  options.handler = function (resp) {
    parser.finish();
    var status = responseStatus(resp);
    if (resp.error || status < 200 || status >= 300 || streamedError) {
      callback(errorFromResponse(resp, streamedError));
      return;
    }
    output = output || completedOutput;
    if (!output) {
      callback(
        serviceError(
          "api",
          parseError
            ? i18n.t("streamParseFailed")
            : i18n.t("apiNoText")
        )
      );
      return;
    }
    callback(null, output);
  };
  http.streamRequest(options);
}

function run(http, config, prompt, query, onText, callback) {
  if (config.stream) {
    requestStream(http, config, prompt, query, onText, callback);
  } else {
    requestOnce(http, config, prompt, query, callback);
  }
}

module.exports = {
  createRequestBody: createRequestBody,
  createSSEParser: createSSEParser,
  errorFromResponse: errorFromResponse,
  extractOutputText: extractOutputText,
  requestOptions: requestOptions,
  run: run,
  serviceError: serviceError
};
