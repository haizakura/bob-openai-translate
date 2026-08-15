import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as appcast from "../scripts/appcast.mjs";

var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
var packageInfo = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

test("release assets use locale-specific GitHub URLs", function () {
  assert.equal(appcast.archiveName("zh-Hans", "0.1.0"), "openai-translate-zh-Hans-v0.1.0.bobplugin");
  assert.equal(
    appcast.releaseURL("en", "0.1.0"),
    "https://github.com/haizakura/bob-openai-translate/releases/download/v0.1.0/openai-translate-en-v0.1.0.bobplugin"
  );
});

test("mergeAppcast replaces the current version and preserves history", function () {
  var result = appcast.mergeAppcast(
    {
      identifier: "com.haizakura.bob.openai.translate",
      versions: [
        { version: "0.1.0", sha256: "old" },
        { version: "0.0.1", sha256: "history" }
      ]
    },
    "com.haizakura.bob.openai.translate",
    { version: "0.1.0", sha256: "new" }
  );

  assert.deepEqual(result.versions, [
    { version: "0.1.0", sha256: "new" },
    { version: "0.0.1", sha256: "history" }
  ]);
});

test("mergeAppcast rejects another plugin identifier", function () {
  assert.throws(function () {
    appcast.mergeAppcast(
      { identifier: "com.example.other", versions: [] },
      "com.haizakura.bob.openai.translate",
      { version: "0.1.0" }
    );
  }, /identifier/);
});

test("checked-in appcasts describe the current localized release", function () {
  [
    { file: "appcast.json", locale: "zh-Hans" },
    { file: "appcast_en.json", locale: "en" }
  ].forEach(function (item) {
    var value = JSON.parse(fs.readFileSync(path.join(root, item.file), "utf8"));
    var latest = value.versions[0];
    assert.equal(value.identifier, "com.haizakura.bob.openai.translate");
    assert.equal(latest.version, packageInfo.version);
    assert.match(latest.sha256, /^[a-f0-9]{64}$/);
    assert.equal(latest.url, appcast.releaseURL(item.locale, packageInfo.version));
    assert.equal(latest.minBobVersion, "1.8.0");
    assert.equal(Number.isSafeInteger(latest.timestamp), true);
  });
});
