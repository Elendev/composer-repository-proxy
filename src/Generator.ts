import fetch from "node-fetch";
import {HttpsProxyAgent} from "https-proxy-agent";
import {packagesJson, providerJson} from "./composerApi";
import prettyBytes from 'pretty-bytes';
import fs from 'fs';
import path from 'path';


export default class Generator {

    private packageJson: packagesJson;

    /**
     * All the packages available
     */
    private packages = {};

    public constructor(private repository: URL, private httpAgent: HttpsProxyAgent = null) {
    }

    /**
     * Get all the informations and init them
     */
    public async init() {
        this.packageJson = await this.fetchPackage();

        const promises = [];

        for(let providerInclude in this.packageJson["provider-includes"]) {
            if (this.packageJson["provider-includes"].hasOwnProperty(providerInclude)) {
                promises.push(this.fetchProvider(this.formatUrl(providerInclude, this.packageJson["provider-includes"][providerInclude].sha256)));
            }
        }

        await this.awaitAll(promises);

        this.printMemoryUsage();
    }

    public async dump(destination: string) {

        let promises = [];
        const packageDestination = destination + '/p/';

        for(let packageName in this.packages) {
            const pkg = {
                packages: {}
            };
            pkg.packages[packageName] = this.packages[packageName];
            const fileName = packageDestination + packageName + '.json';

            promises.push(
                fs.promises.mkdir(path.dirname(fileName), {
                    recursive: true
                }).then(() => {
                    promises.push(fs.promises.writeFile(fileName, JSON.stringify(pkg)).then(
                        () => {
                            console.log('File ' + fileName + ' dumped')
                        })
                    );
                })
            );

            if (promises.length === 1024) {
                await this.awaitAll(promises);
                promises = []
            }
        }

        await this.awaitAll(promises);
    }

    private async fetchPackage(): Promise<packagesJson> {
        return await this.doFetch(this.repository.href + '/packages.json') as packagesJson;
    }

    private async fetchProvider(providerUrl: string) {
        const provider = await this.doFetch(providerUrl) as providerJson;

        const promises = [];

        console.log('Starting provider ' + providerUrl);

        if (provider.packages) {
            for(let packageName in provider.packages) {
                promises.push(this.addPackage(packageName, provider.packages[packageName]));
            }
        }

        if (provider.providers) {
            for(let providerName in provider.providers) {
                promises.push(this.fetchProvider(this.formatUrl(this.packageJson['providers-url'], provider.providers[providerName].sha256, providerName)));
            }
        }

        await this.awaitAll(promises);
        console.log('Provider ' + providerUrl + ' done');
        this.printMemoryUsage();
    }

    private async addPackage(packageName: string, pkg: any) {
        if (!this.packages.hasOwnProperty(packageName)) {
            this.packages[packageName] = {};
        }

        this.packages[packageName] = {...this.packages[packageName], ...pkg};
    }

    /**
     * Format the URL
     */
    private formatUrl(packageUrl: string, hash: string = undefined, pkg: string = undefined): string {

        if (hash !== undefined) {
            packageUrl = packageUrl.replace('%hash%', hash);
        }

        if (pkg !== undefined) {
            packageUrl = packageUrl.replace('%package%', pkg);
        }

        if (packageUrl.startsWith('/')) {
            return this.repository.origin + packageUrl;
        } else {
            return this.repository + '/' + packageUrl;
        }
    }

    private async doFetch (url: string, options?: any): Promise<object> {
        return (await fetch(url, {
            agent: this.httpAgent
        })).json()
    }

    private printMemoryUsage() {
        console.log('Memory usage: ' + prettyBytes(process.memoryUsage().rss));
    }

    async awaitAll(promises: any[]) {
        for(let i = 0; i < promises.length; i ++) {
            await promises[i];
        }
    }
}