"use strict";

var service = require("./modules/service.js");

function supportLanguages() {
  return service.supportLanguages();
}

function pluginTimeoutInterval() {
  return service.pluginTimeoutInterval(typeof $option === "object" && $option ? $option : {});
}

function translate(query, legacyCompletion) {
  return service.translate(
    $http,
    typeof $option === "object" && $option ? $option : {},
    query,
    legacyCompletion
  );
}

function pluginValidate(completion) {
  return service.pluginValidate(
    $http,
    typeof $option === "object" && $option ? $option : {},
    completion
  );
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    pluginTimeoutInterval: pluginTimeoutInterval,
    pluginValidate: pluginValidate,
    supportLanguages: supportLanguages,
    translate: translate
  };
}
