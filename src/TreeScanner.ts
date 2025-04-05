import path from 'path';
import { promises as fs } from 'fs';

import { Minimatch } from 'minimatch';

import * as Utils from './helpers/utils.js';

import type PPLLM from './index.js';
import { TreeNodeDir, TreeNodeFile } from './TreeNode.js';

//

export default class TreeScanner {
    private readonly ppllm: PPLLM;

    //

    constructor(ppllm: PPLLM) {
        this.ppllm = ppllm;
    }

    //

    async scanDir(dir: string, matchers: Minimatch[]): Promise<TreeNodeDir> {
        const dirconfig = this.ppllm.readDirConfigFile(path.join(dir, this.ppllm.cli.dirconfig));

        const newPatterns: string[] = dirconfig?.ignore ?? [];
        const combinedMatchers = matchers.concat(this.ppllm.buildIgnoreMatchers(this.ppllm.absoluteSourceDirectory, dir, newPatterns));

        //

        const absPath = path.resolve(dir);
        const relativePath = path.relative(this.ppllm.absoluteSourceDirectory, absPath) || '.';

        const node = new TreeNodeDir(relativePath, absPath, path.basename(dir), dirconfig);

        //

        const items = await fs.readdir(dir, { withFileTypes: true });

        for (const item of items) {
            const itemPath = path.join(dir, item.name);
            const itemAbsPath = path.resolve(itemPath);

            //

            if (item.name === this.ppllm.cli.dirconfig)
                continue;

            if (this.ppllm.absoluteOutputPath && itemAbsPath === this.ppllm.absoluteOutputPath)
                continue;

            if (this.isIgnored(itemAbsPath, combinedMatchers))
                continue;

            //

            if (item.isDirectory()) {
                const childDir = await this.scanDir(itemPath, combinedMatchers);
                node.files.push(childDir);
            }
            else if (item.isFile()) {
                const isBinary = await Utils.IsFileBinary(itemAbsPath);

                if (this.ppllm.settings.binary === 'none' && isBinary)
                    continue;

                node.files.push(new TreeNodeFile(
                    path.relative(this.ppllm.absoluteSourceDirectory, itemAbsPath),
                    itemAbsPath,
                    item.name,
                    isBinary
                ));
            }
        }

        return node;
    }

    //

    private isIgnored(itemPath: string, matchers: Minimatch[]): boolean {
        const relativePath = path.relative(this.ppllm.absoluteSourceDirectory, itemPath);
        const posix = Utils.ConvertPathToPOSIX(relativePath);

        return matchers.some(m => m.match(posix));
    }
}