import fetch from "node-fetch";
import {HttpsProxyAgent} from "https-proxy-agent";
import {packagesJson, providerJson} from "./composerApi";

interface config {
  repository: URL,
  output: string,
  requestDefaultOptions,
  packages?: packagesJson
}

let httpAgent;
let defaultOptions = {

}


if (process.env.hasOwnProperty('https_proxy')) {
  httpAgent = new HttpsProxyAgent(process.env.https_proxy);
  defaultOptions['agent'] = httpAgent;
}

async function start(config: config) {

  config.packages = await (await fetch(config.repository.href + '/packages.json', config.requestDefaultOptions)).json();

  const providerPromises = [];

  for(let providerPath in config.packages["provider-includes"]) {

    let providerUrl = providerPath.replace('%hash%', config.packages["provider-includes"][providerPath].sha256);

    if (providerUrl.startsWith('/')) {
      providerUrl = config.repository.origin + providerUrl;
    } else {
      providerUrl = config.repository + '/' + providerUrl;
    }

    providerPromises.push(handleProvider(
      providerUrl,
      config
    ));
  }

  await awaitAll(providerPromises);
}

async function handleProvider(url: string, config: config) {
  const provider: providerJson = await (await fetch(url, config.requestDefaultOptions)).json();

  const providerPromises = [];

  if (provider.providers) {
    for(let providerName in provider.providers) {
      let providerUrl = config.packages['providers-url'].replace('%package%', providerName).replace('%hash%', provider.providers[providerName].sha256);

      if (providerUrl.startsWith('/')) {
        providerUrl = config.repository.origin + providerUrl;
      } else {
        providerUrl = config.repository + '/' + providerUrl;
      }

      providerPromises.push(handleProvider(providerUrl, config));
    }
  }


  if (provider.packages) {
    for(let packageName in provider.packages) {
      console.log(packageName);
    }
  }

  await awaitAll(providerPromises);
}


start({
  repository: new URL('https://packages.drupal.org/8'),
  output: './output',
  requestDefaultOptions: defaultOptions
});

async function awaitAll(promises: any[]) {
  for(let i = 0; i < promises.length; i ++) {
    await promises[i];
  }
}
