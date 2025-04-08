import type CommandGenerate from './index.js';

import { TreeNode, TreeNodeDir } from './TreeNode.js';

//

export default class TreePrinter {
    private readonly parent: CommandGenerate;

    //

    constructor(parent: CommandGenerate) {
        this.parent = parent;
    }

    //

    print(root: TreeNodeDir): string {
        let out = `${this.parent.ppllm.settingsHandler.settings.emoji ? `${root.emoji} ` : ''}${root.fileName}${!this.parent.ppllm.settingsHandler.settings.emoji ? '/' : ''}\n`;
        out += this.printTreeRecursive(root.files, '');
        return out;
    }

    private printTreeRecursive(nodes: TreeNode[], prefix: string): string {
        let lines: string[] = [];

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

            const line = `${prefix}${connector} ${this.parent.ppllm.settingsHandler.settings.emoji ? `${node.emoji} ` : ''}${node.fileName}${node instanceof TreeNodeDir && !this.parent.ppllm.settingsHandler.settings.emoji ? '/' : ''}`;
            lines.push(line);

            if (node instanceof TreeNodeDir && node.files.length > 0) {
                const subtree = this.printTreeRecursive(node.files, isLast ? prefix + '   ' : prefix + '│  ');
                if (subtree.trim().length > 0) {
                    lines.push(subtree);
                }
            }
        });

        return lines.join('\n');
    }
}