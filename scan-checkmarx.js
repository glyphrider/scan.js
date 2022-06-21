var fs = require('fs');
var https = require('https');
var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});

rl.on("line", (filename) => {
    fs.readFile(filename, (err,data) => {
        let jsonData = data;
        let jsonParsed = JSON.parse(jsonData);
        // console.log(typeof jsonParsed.components);
        // console.log(JSON.stringify(jsonParsed.components));
        for(var component in jsonParsed.components) {
            if(jsonParsed.components[component].type != "library") continue;
            let purl = jsonParsed.components[component].purl
            let yarn = purl.startsWith("pkg:Yarn/") || purl.startsWith("pkg:Npm/");
            let name = jsonParsed.components[component].name;
            let version = jsonParsed.components[component].version;
            if(yarn) {
                let url = `https://registry.yarnpkg.com/${name}/${version}`;
                let respStream = "";
                setTimeout(() => {
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
                              console.log(`${name} (${version}) -> ${license}`)
                            } catch (error) {
                              console.log(`*** error parsing json at ${url}`);
                            }
    
                          })
                        );
                      });
                      req.on("error", (error) => {
                        console.log(`*** error at ${url} =>> ${JSON.stringify(error)}`);
                      });
                      req.end();              
                }, 250);
            }
        };
    });
});