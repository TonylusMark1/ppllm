import path from 'path';
import { promises as fs } from 'fs';

import { Minimatch } from 'minimatch';

import { options, T } from './base/global.js';
import Config from "./base/config.js"

import * as Utils from './helpers/utils.js';

import { TreeNodeDir, TreeNodeFile } from './TreeNode.js';

//

export default class FileTreeScanner {
    static async ScanDir(dir: string, matchers: Minimatch[]): Promise<TreeNodeDir> {
        const config = await this.ReadConfigFile(dir);

        const newPatterns: string[] = config?.ignore ?? [];
        const combinedMatchers = matchers.concat(Utils.BuildIgnoreMatchers(options.dirPath, dir, newPatterns));

        //

        const absPath = path.resolve(dir);
        const relativePath = path.relative(options.dirPath, absPath) || '.';

        const node = new TreeNodeDir(relativePath, absPath, path.basename(dir), config);

        //

        const items = await fs.readdir(dir, { withFileTypes: true });

        for (const item of items) {
            const itemPath = path.join(dir, item.name);
            const itemAbsPath = path.resolve(itemPath);

            //

            if (item.name === options.configFileName)
                continue;

            if (options.savePath && itemAbsPath === options.savePath)
                continue;

            if (this.IsIgnored(itemAbsPath, combinedMatchers))
                continue;

            //

            if (item.isDirectory()) {
                const childDir = await this.ScanDir(itemPath, combinedMatchers);
                node.files.push(childDir);
            }
            else if (item.isFile()) {
                const isBinary = await Utils.IsFileBinary(itemAbsPath);

                if (options.cli.binary === 'none' && isBinary)
                    continue;

                node.files.push(new TreeNodeFile(
                    path.relative(options.dirPath, itemAbsPath),
                    itemAbsPath,
                    item.name,
                    isBinary
                ));
            }
        }

        return node;
    }

    //

    private static IsIgnored(itemPath: string, matchers: Minimatch[]): boolean {
        const relativePath = path.relative(options.dirPath, itemPath);
        const posix = Utils.ConvertPathToPOSIX(relativePath);

        //console.log(`## ${posix.padEnd(45)}, matchers: ${matchers.map(m => `${m.match(posix) ? "✅" : "❌"} ${m.pattern}`).join(" ")}`);

        return matchers.some(m => m.match(posix));
    }

    //

    private static async ReadConfigFile(directory: string) {
        if (options.configFileName !== false) {
            const configFilePath = path.join(directory, options.configFileName);

            try {
                await fs.access(configFilePath);

                const content = await fs.readFile(configFilePath, 'utf8');

                try {
                    const config = <Config>JSON.parse(content);

                    if (Array.isArray(config.ignore)) {
                        config.ignore.forEach((p, i, list) => {
                            list[i] = path.resolve(directory, p);
                        });
                    }

                    return config;
                }
                catch (e) {
                    console.log(T.configReadingError(configFilePath));
                }
            }
            catch (_) {
                // brak pliku konfiguracyjnego – OK
            }
        }

        return undefined;
    }
}