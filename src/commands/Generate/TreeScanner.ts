import path from 'path';
import { promises as fs } from 'fs';

import { Minimatch } from 'minimatch';

import * as Utils from '../../helpers/utils.js';

import type CommandGenerate from './index.js';
import { TreeNodeDir, TreeNodeFile } from './TreeNode.js';

//

export default class TreeScanner {
    private readonly command: CommandGenerate;

    //

    constructor(command: CommandGenerate) {
        this.command = command;
    }

    //

    async scanDir(dir: string, matchers: Minimatch[]): Promise<TreeNodeDir> {
        const dirconfig = this.command.readDirConfigFile(path.join(dir, this.command.ppllm.cli.o.dirconfig));

        const newPatterns: string[] = dirconfig?.ignore ?? [];
        const combinedMatchers = matchers.concat(this.command.buildIgnoreMatchers(this.command.absoluteSourceDirectory, dir, newPatterns));

        //

        const absPath = path.resolve(dir);
        const relativePath = path.relative(this.command.absoluteSourceDirectory, absPath) || '.';

        const node = new TreeNodeDir(relativePath, absPath, path.basename(dir), dirconfig);

        //

        const items = await fs.readdir(dir, { withFileTypes: true });

        for (const item of items) {
            const itemPath = path.join(dir, item.name);
            const itemAbsPath = path.resolve(itemPath);

            //

            if (item.name === this.command.ppllm.cli.o.dirconfig)
                continue;

            if (this.command.absoluteOutputPath && itemAbsPath === this.command.absoluteOutputPath)
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

                if (this.command.ppllm.cli.settings.o.binary === 'none' && isBinary)
                    continue;

                node.files.push(new TreeNodeFile(
                    path.relative(this.command.absoluteSourceDirectory, itemAbsPath),
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
        const relativePath = path.relative(this.command.absoluteSourceDirectory, itemPath);
        const posix = Utils.ConvertPathToPOSIX(relativePath);

        return matchers.some(m => m.match(posix));
    }
}