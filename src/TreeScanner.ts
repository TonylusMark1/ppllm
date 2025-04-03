import path from 'path';
import { promises as fs } from 'fs';

import { options, T } from './base/global.js';
import Config from "./base/config.js"

import * as Utils from './helpers/utils.js';

import { TreeNodeDir, TreeNodeFile } from './TreeNode.js';

//

export default class FileTreeScanner {
    static async ScanDir(dir: string, parentIgnorePaths: string[]): Promise<TreeNodeDir> {
        let config = await this.ReadConfigFile(dir);

        let ignorePaths: string[] = [...parentIgnorePaths, ...config?.ignore ?? []];

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

            if (this.IsIgnored(itemAbsPath, ignorePaths))
                continue;

            //

            if (item.isDirectory()) {
                const childDir = await this.ScanDir(itemPath, ignorePaths);
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

    private static IsIgnored(itemPath: string, ignorePaths: string[]): boolean {
        return ignorePaths.some(
            (ignored) => {
                return itemPath === ignored || itemPath.startsWith(ignored + path.sep);
            }
        );
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