import fs from "fs";
import path from "path";
import crypto from "crypto";

interface providerInfos {
    pkg: string,
    algo: string,
    hash: string
};

export default class Dumper {

    private mainProviderName = '/p/all$%hash%.json';

    private providerNames = [
        '/p/%package%$%hash%.json',
        '/p/%package%.json',
        '/p2/%package%.json',
    ];

    public async dump(packages: object, destination: string) {

        let promises = [];

        const providersInfos = [];

        for (let packageName in packages) {
            promises.push(this.dumpPackage(packages, packageName, destination));

            if (promises.length === 1024) {
                providersInfos.push(...(await this.awaitAll<providerInfos>(promises)));
                promises = []
            }
        }

        providersInfos.push(...(await this.awaitAll<providerInfos>(promises)));

        await this.dumpProvider(providersInfos, destination);
    }

    private async dumpPackage(packages: any, packageName: string, destination: string): Promise<providerInfos> {

        const packageDestination = destination;

        const pkg = {
            packages: {}
        };

        pkg.packages[packageName] = packages[packageName];
        const content = JSON.stringify(pkg) + '\n';

        const hash = await this.hash(content);

        for (let i = 0; i < this.providerNames.length; i++) {
            await this.writeFile(packageDestination + this.providerNames[i].replace('%package%', packageName).replace('%hash%', hash.value), content);
        }

        return {
            pkg: packageName,
            algo: hash.algo,
            hash: hash.value,
        };
    }

    private async dumpProvider(infos: providerInfos[], destination: string) {

        const providerFileObject = {providers: {}};

        for (let i = 0; i < infos.length; i ++) {
            const currentInfo = infos[i];
            providerFileObject.providers[currentInfo.pkg] = {}
            providerFileObject.providers[currentInfo.pkg][currentInfo.algo] = currentInfo.hash
        }

        const content = JSON.stringify(providerFileObject) + '\n';
        const hash = await this.hash(content);

        await this.writeFile(destination + this.mainProviderName.replace('%hash%', hash.value), content);
    }

    private async writeFile(filename: string, content: string) {
        await fs.promises.mkdir(path.dirname(filename), {
            recursive: true
        });

        await fs.promises.writeFile(filename, content).then(() => {
            console.log('File ' + filename + ' dumped')
        })
    }

    private async awaitAll<T>(promises: any[]): Promise<T[]> {
        const values = [];
        for (let i = 0; i < promises.length; i++) {
            values.push(await promises[i]);
        }

        return values;
    }

    private async hash(content: string): Promise<{ algo: string, value: string }> {
        const algorithm = 'sha256';
        let sha256sum = crypto.createHash(algorithm);
        return {algo: algorithm, value: sha256sum.update(content).digest('hex')};
    }

}