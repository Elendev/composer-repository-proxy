import fetch from "node-fetch";
import {HttpsProxyAgent} from "https-proxy-agent";
import {packagesJson, providerJson} from "./composerApi";
import Generator from "./Generator";
import Dumper from "./Dumper";


let httpAgent;

if (process.env.hasOwnProperty('https_proxy')) {
  httpAgent = new HttpsProxyAgent(process.env.https_proxy);
}

const generator = new Generator(new URL('https://packages.drupal.org/8'), httpAgent)
const dumper = new Dumper();

console.time('generate');
generator.getPackages().then(packages => {
  dumper.dump(packages, process.cwd() + '/output').then(() => {
    console.timeEnd('generate');
  });
});
