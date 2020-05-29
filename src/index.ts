import fetch from "node-fetch";
import {HttpsProxyAgent} from "https-proxy-agent";
import {packagesJson, providerJson} from "./composerApi";
import Generator from "./Generator";


let httpAgent;

if (process.env.hasOwnProperty('https_proxy')) {
  httpAgent = new HttpsProxyAgent(process.env.https_proxy);
}

const generator = new Generator(new URL('https://packages.drupal.org/8'), httpAgent)

console.time('generate');
console.time('init');
generator.init().then(() => {
  console.log('Init done');
  console.timeEnd('init');
  console.time('dump');
  generator.dump(process.cwd() + '/output').then(() => {
    console.log('Dump done');
    console.timeEnd('dump');
    console.timeEnd('generate');
  });
});
