import path from 'path';
import { promises as fs } from 'fs';
import { options } from './base/global.js';
import ConfigHandler from "./ConfigHandler.js";
import * as Utils from './helpers/utils.js';
import { TreeNodeDir, TreeNodeFile } from './TreeNode.js';
//
export default class FileTreeScanner {
    static async ScanDir(dir, matchers) {
        const config = await this.ReadConfigFile(dir, options.configFileName);
        const newPatterns = config?.ignore ?? [];
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
            if (options.outputPath && itemAbsPath === options.outputPath)
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
                node.files.push(new TreeNodeFile(path.relative(options.dirPath, itemAbsPath), itemAbsPath, item.name, isBinary));
            }
        }
        return node;
    }
    //
    static IsIgnored(itemPath, matchers) {
        const relativePath = path.relative(options.dirPath, itemPath);
        const posix = Utils.ConvertPathToPOSIX(relativePath);
        //console.log(`## ${posix.padEnd(45)}, matchers: ${matchers.map(m => `${m.match(posix) ? "✅" : "❌"} ${m.pattern}`).join(" ")}`);
        return matchers.some(m => m.match(posix));
    }
    //
    static async ReadConfigFile(directory, configFileName) {
        if (configFileName !== false) {
            const configFilePath = path.join(directory, configFileName);
            return await ConfigHandler.ReadConfigFile(configFilePath);
        }
        return undefined;
    }
}
