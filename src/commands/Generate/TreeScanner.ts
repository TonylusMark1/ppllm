import path from 'path';
import { promises as fs } from 'fs';

import { Minimatch } from 'minimatch';

import * as Utils from '../../helpers/utils.js';

import type CommandGenerate from './index.js';
import { TreeNodeDir, TreeNodeFile } from './TreeNode.js';

//

export default class TreeScanner {
    private readonly parent: CommandGenerate;

    //

    constructor(parent: CommandGenerate) {
        this.parent = parent;
    }

    //

    async scanDir(dir: string, matchers: Minimatch[]): Promise<TreeNodeDir> {
        const dirConfigPath = path.join(dir, this.parent.ppllm.settingsHandler.settings.dirconfig);
        const dirconfig = this.parent.ppllm.dirConfigHandler.read(dirConfigPath);

        const newPatterns: string[] = dirconfig?.ignore ?? [];
        const combinedMatchers = matchers.concat(this.parent.buildIgnoreMatchers(this.parent.absoluteSourceDirectory, dir, newPatterns));

        //

        const absPath = path.resolve(dir);
        const relativePath = path.relative(this.parent.absoluteSourceDirectory, absPath) || '.';

        const node = new TreeNodeDir(relativePath, absPath, path.basename(dir), dirconfig);

        //

        const items = await fs.readdir(dir, { withFileTypes: true });

        for (const item of items) {
            const itemPath = path.join(dir, item.name);
            const itemAbsPath = path.resolve(itemPath);

            //

            if (item.name === this.parent.o.dirconfig)
                continue;

            if (this.parent.absoluteOutputPath && itemAbsPath === this.parent.absoluteOutputPath)
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

                if (this.parent.settings.binary === 'none' && isBinary)
                    continue;

                node.files.push(new TreeNodeFile(
                    path.relative(this.parent.absoluteSourceDirectory, itemAbsPath),
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
        const relativePath = path.relative(this.parent.absoluteSourceDirectory, itemPath);
        const posix = Utils.ConvertPathToPOSIX(relativePath);

        return matchers.some(m => m.match(posix));
    }
}