import path from 'path';
import { promises as fs } from 'fs';
import * as Utils from './helpers/utils.js';
import { TreeNodeDir, TreeNodeFile } from './TreeNode.js';
//
export default class TreeScanner {
    ppllm;
    //
    constructor(ppllm) {
        this.ppllm = ppllm;
    }
    //
    async scanDir(dir, matchers) {
        const dirconfig = this.ppllm.readDirConfigFile(path.join(dir, this.ppllm.cli.dirconfig));
        const newPatterns = dirconfig?.ignore ?? [];
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
                node.files.push(new TreeNodeFile(path.relative(this.ppllm.absoluteSourceDirectory, itemAbsPath), itemAbsPath, item.name, isBinary));
            }
        }
        return node;
    }
    //
    isIgnored(itemPath, matchers) {
        const relativePath = path.relative(this.ppllm.absoluteSourceDirectory, itemPath);
        const posix = Utils.ConvertPathToPOSIX(relativePath);
        return matchers.some(m => m.match(posix));
    }
}
