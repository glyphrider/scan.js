var fs = require('fs');
var https = require('https');
var readline = require('readline');

var csvData = "";

async function fetch(package, version) {
	return new Promise(resolve => {
		var url = `https://registry.npmjs.org/${package}/${version}`;
		var respStream = "";
		const req = https.get(url, res => {
			res.on('data', d => {
				respStream += d;
			},
				res.on('close', d => {
					var jsonData = JSON.parse(respStream);
					var license = jsonData.license;
					if (license == undefined)
						license = jsonData.licenses;
					if (license == undefined)
						license = 'N/A';
					resolve({ name: package, version: version, license: license, url: url });
				}));
		});
		req.on('error', error => {
			console.log(`*** could not locate info for ${package} ${version}`);
		});
		req.end();
	});
}

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

rl.on('line', line => {
	fs.readFile(line, function (err, data) {
		var jsonData = data;
		var jsonParsed = JSON.parse(jsonData);

		for (var dep in jsonParsed.dependencies) {
			fetch(dep, jsonParsed.dependencies[dep].version).then(
				function (result) {
					console.log(`${result.name} (${result.version}) --> ${JSON.stringify(result.license)} from ${result.url}`);
				},
				function (error) { }
			);
		}
	});
});

