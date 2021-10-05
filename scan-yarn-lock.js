var fs = require('fs');
var https = require('https');
var readline = require('readline');
var util = require('util');

var csvData = "";

async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve,ms));
}

async function fetch(owner, project, version) {
	return new Promise(resolve => {
		var url = `https://registry.yarnpkg.com/${owner}/${project}/${version}`
		if(owner == '-')
			url = `https://registry.yarnpkg.com/${project}/${version}`

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
					resolve({ owner: owner, project: project, version: version, license: license, url: url });
				}));
		});
		req.on('error', error => {
			console.log(`*** error at ${url} =>> ${JSON.stringify(error)}`);
			// resolve(fetch(owner,project,version,retries));
		});
		req.end();
	});
}

const timer = ms => new Promise(res => setTimeout(res,ms));

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

rl.on('line', line => {
	fs.readFile(line, function (err, data) {
		lines = data.toString().split(/\r?\n/);
		var packages = [];
		var owner = "";
		var project = "";
		lines.forEach((line) => {
			
			if(/^#/.test(line) // skip comments
			  || /^\s*$/.test(line) // skip blank lines
			  ) {
				// console.log("skipping =>> " + line);
			} else if(/^  version /.test(line)) {
				var match = line.match(/^  version "([^"]*)"/);
				var version = match[1];
				packages.push({owner: owner, project: project, version: version});
				// fetch(owner,project, version).then(
				// 	function(result) {
				// 		console.log(`${result.owner}/${result.project} (${result.version}) --> ${JSON.stringify(result.license)} from ${result.url}`)
				// 	},
				// 	function(error) {
				// 		console.log("poop");
				// 	});
				// console.log("owner = " + owner + " project = "+project+ " version = " + match[1]);
			} else if(/^"?@/.test(line)) {
				var match = line.match(/^"?(@[^\/]*)\/([^@]*)/);
				owner = match[1];
				project = match[2];
			} else if(/^[^\s]/.test(line)) {
			  	var match = line.match(/^"?([^@]*)/);
				owner = "-";
			  	project = match[1];
			}
		});

		packages.forEach((pkg,i) => {
			setTimeout(function() {
			fetch(pkg.owner, pkg.project, pkg.version).then(
				function(result) {
					console.log(`${result.owner}/${result.project} (${result.version}) --> ${JSON.stringify(result.license)} from ${result.url}`)
				},
				function(error) {
					console.log("poop");
				}
			);
			},100*i);
		});
					/*
		for (var dep in jsonParsed.dependencies) {
			fetch(dep, jsonParsed.dependencies[dep].version).then(
				function (result) {
					console.log(`${result.name} (${result.version}) --> ${JSON.stringify(result.license)} from ${result.url}`);
				},
				function (error) { }
			);
		}
		*/
	});
});

