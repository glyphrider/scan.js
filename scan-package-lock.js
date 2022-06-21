var fs = require("fs");
var https = require("https");
var readline = require("readline");

var csvData = "";

// console.log(`"Name","Version","License","package-lock.json","URL"`);

var i = 0;

async function fetch(filename_arg, package_arg, version_arg) {
  await new Promise((r) => setTimeout(r, 20 * i++));
  return new Promise((resolve) => {
	let filename = filename_arg;
    let package = package_arg;
    let version = version_arg;
    let url = `https://registry.npmjs.org/${package}/${version}`;
    let respStream = "";
    const req = https.get(url, (res) => {
      res.on(
        "data",
        (d) => {
          respStream += d;
        },
        res.on("close", (d) => {
          var jsonData = JSON.parse(respStream);
          var license = jsonData.license;
          if (license == undefined) license = jsonData.licenses;
          if (license == undefined) license = "N/A";
          resolve({
            name: package,
            version: version,
            license: license,
            url: url,
			filename: filename,
          });
        })
      );
    });
    req.on("error", (error) => {
      console.log(
        `*** could not locate info for ${package} ${version} from ${url} (${error.message})`
      );
    });
    req.end();
  });
}

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", (filename) => {
  fs.readFile(filename, function (err, data) {
    let jsonData = data;
    let jsonParsed = JSON.parse(jsonData);
    for (var dep in jsonParsed.dependencies) {
      let version = jsonParsed.dependencies[dep].version;
      fetch(filename, dep, version).then(
        function (result) {
          console.log(
            `${result.name} (${result.version}) --> ${JSON.stringify(
              result.license
            )} from ${result.url}`
          );
        //   console.log(`"${result.name}","${result.version}",${typeof result.license === 'string' ? '"' + result.license + '"' : JSON.stringify(result.license)},"${result.filename}","${result.url}"`);
        },
        function (error) {
          console.log(`*** ${error.message} ***`);
        }
      );
    }
  });
});
