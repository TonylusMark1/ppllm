import { promises as fs } from 'fs';
import path from 'path';
import { options, T } from './base/global.js';
import * as Consts from './base/consts.js';
import * as ExtEmojis from "./helpers/extEmojis.js";
import { TreeNode, TreeNodeDir } from './TreeNode.js';
//
export default class PromptGen {
    static async Generate(root) {
        const structure = this.PrintTree(root);
        let output = '';
        //
        output += `${T.promptPlaceholder}\n\n`;
        //
        // Jeśli główny (zewnętrzny) config zawiera prompt – wyświetl go od razu po placeholderze
        if (root.config && root.config.prompt) {
            output += root.config.prompt + '\n\n';
        }
        //
        output += `${options.cli.emoji ? `${Consts.EMOJI.fileStructure} ` : ''}${T.fileStructure}\n\n`;
        output += structure + '\n\n';
        //
        const innerPrompts = this.collectInnerPrompts(root); // Zbieramy inner prompty z wszystkich zagnieżdżonych katalogów
        if (innerPrompts.length)
            output += this.PrintInnerPrompts(root, innerPrompts) + "\n\n";
        //
        output += `${options.cli.emoji ? `${Consts.EMOJI.fileContents} ` : ''}${T.fileContents}\n\n`;
        const flatFiles = TreeNode.Flatten(root.files);
        flatFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
        for (const file of flatFiles) {
            if (file.isBinary && options.cli.binary !== 'all')
                continue; // Pomijamy binarne pliki z wyjątkiem trybu 'all'
            //
            let content = '';
            let placeholder = false;
            try {
                const stats = await fs.stat(file.absolutePath);
                if (options.maxSizeBytes && stats.size > options.maxSizeBytes) {
                    content = `[${T.largeFile}]`;
                    placeholder = true;
                }
                else if (file.isBinary) {
                    content = `[${T.binaryFile}]`;
                    placeholder = true;
                }
                else {
                    content = await fs.readFile(file.absolutePath, 'utf8');
                }
            }
            catch {
                const readErrorMsg = T.readError(file.absolutePath);
                content = `[${readErrorMsg}]`;
                placeholder = true;
                console.log(readErrorMsg);
            }
            const filePathWithRoot = path.join(root.fileName, file.relativePath);
            output += `${T.file}: ${options.cli.emoji ? `${file.emoji} ` : ''}${filePathWithRoot}\n\n`;
            if (placeholder) {
                output += content + '\n\n';
            }
            else {
                output += '```\n';
                output += content.trim() + '\n';
                output += '```\n\n';
            }
        }
        return output;
    }
    //
    // Nowa funkcja wypisująca strukturę drzewa z root wypisanym osobno (bez łączników)
    static PrintTree(root) {
        // Wypisz root bez prefiksu (bez łączników)
        let out = `${options.cli.emoji ? `${root.emoji} ` : ''}${root.fileName}${!options.cli.emoji ? '/' : ''}\n`;
        out += this.PrintTreeRecursive(root.files, '');
        return out;
    }
    static PrintTreeRecursive(nodes, prefix) {
        let lines = [];
        const sorted = [...nodes].sort((a, b) => {
            const aIsDir = a instanceof TreeNodeDir;
            const bIsDir = b instanceof TreeNodeDir;
            if (aIsDir === bIsDir)
                return a.fileName.localeCompare(b.fileName);
            else
                return aIsDir ? -1 : 1;
        });
        sorted.forEach((node, index) => {
            const isLast = index === sorted.length - 1;
            const connector = isLast ? '└─' : '├─';
            const line = `${prefix}${connector} ${options.cli.emoji ? `${node.emoji} ` : ''}${node.fileName}${node instanceof TreeNodeDir && !options.cli.emoji ? '/' : ''}`;
            lines.push(line);
            if (node instanceof TreeNodeDir && node.files.length > 0) {
                const subtree = this.PrintTreeRecursive(node.files, isLast ? prefix + '   ' : prefix + '│  ');
                if (subtree.trim().length > 0) {
                    lines.push(subtree);
                }
            }
        });
        return lines.join('\n');
    }
    //
    static PrintInnerPrompts(root, innerPrompts) {
        return (`${options.cli.emoji ? `${Consts.EMOJI.innerPromptsHeader} ` : ''}${T.innerPromptsHeader}\n\n` +
            innerPrompts
                .map(ip => {
                return (`${options.cli.emoji ? `${ExtEmojis.folder} ` : ''}${ip.directory} - ${T.innerPromptRules}:\n\n` +
                    `${ip.prompt}`);
            })
                .join("\n\n"));
    }
    //
    static collectInnerPrompts(node, root = node) {
        let results = [];
        // Pomijamy katalog główny (root) – inner prompty tylko z zagnieżdżonych configów
        for (const child of node.files) {
            if (child instanceof TreeNodeDir) {
                if (child.config && child.config.prompt) {
                    const filePathWithRoot = path.join(root.fileName, child.relativePath);
                    results.push({
                        directory: filePathWithRoot,
                        prompt: child.config.prompt
                    });
                }
                results = results.concat(this.collectInnerPrompts(child, root));
            }
        }
        return results;
    }
}
