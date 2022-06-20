var fs = require("fs");
var https = require("https");
var readline = require("readline");
var util = require("util");

var csvData = "";

var i = 0;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetch(owner_arg, project_arg, version_arg) {
  await new Promise((r) => setTimeout(r, 20 * i++));
  return new Promise((resolve) => {
    var owner = owner_arg;
    var project = project_arg;
    var version = version_arg;
    var url = `https://registry.yarnpkg.com/${owner}/${project}/${version}`;
    if (owner == "-")
      url = `https://registry.yarnpkg.com/${project}/${version}`;
    var respStream = "";
    const req = https.get(url, (res) => {
      res.on(
        "data",
        (d) => {
          respStream += d;
        },
        res.on("close", (d) => {
          var license = undefined;
          try {
            var jsonData = JSON.parse(respStream);
            license = jsonData.license;
            if (license == undefined) license = jsonData.licenses;
            if (license == undefined) license = "N/A";
          } catch (error) {
            console.log(`*** error parsing json at ${url}`);
          }
          resolve({
            owner: owner,
            project: project,
            version: version,
            license: license,
            url: url,
          });
        })
      );
    });
    req.on("error", (error) => {
      console.log(`*** error at ${url} =>> ${JSON.stringify(error)}`);
    });
    req.end();
  });
}

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", (filename) => {
  console.log(`processing ${filename}`);
  fs.readFile(filename, function (err, data) {
    lines = data.toString().split(/\r?\n/);
    var owner = "";
    var project = "";
    lines.forEach((line) => {
      if (
        /^#/.test(line) || // skip comments
        /^\s*$/.test(line) // skip blank lines
      ) {
        // console.log("skipping =>> " + line);
      } else if (/^  version /.test(line)) {
        var match = line.match(/^  version "([^"]*)"/);
        var version = match[1];
        fetch(owner, project, version).then(
          function (result) {
            console.log(
              `${result.owner}/${result.project} (${
                result.version
              }) --> ${JSON.stringify(result.license)} from ${result.url}`
            );
          },
          function (error) {
            console.log("poop");
          }
        );
      } else if (/^"?@/.test(line)) {
        var match = line.match(/^"?(@[^\/]*)\/([^@]*)/);
        owner = match[1];
        project = match[2];
      } else if (/^[^\s]/.test(line)) {
        var match = line.match(/^"?([^@]*)/);
        owner = "-";
        project = match[1];
      }
    });
  });
});
