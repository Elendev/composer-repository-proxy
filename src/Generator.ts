import fetch from "node-fetch";
import {HttpsProxyAgent} from "https-proxy-agent";
import {packagesJson, providerJson} from "./composerApi";
import prettyBytes from 'pretty-bytes';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';


export default class Generator {

    private providerNames = [
        '/p/%package%$%hash%.json',
        '/p/%package%.json',
        '/p2/%package%.json',
    ];

    private packageJson: packagesJson = undefined;

    /**
     * All the packages available
     */
    private packages = {};

    public constructor(private repository: URL, private httpAgent: HttpsProxyAgent = null) {
    }

    public async getPackages(): Promise<object> {
        if (this.packageJson === undefined) {
            await this.init();
        }

        return this.packages;
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

    private async awaitAll(promises: any[]) {
        for(let i = 0; i < promises.length; i ++) {
            await promises[i];
        }
    }

    private async hash(content: string): Promise<{algo: string, value: string}> {
        const algorithm = 'sha256';
        let sha256sum = crypto.createHash(algorithm);
        return {algo: algorithm, value: sha256sum.update(content).digest('hex')};
    }
}
