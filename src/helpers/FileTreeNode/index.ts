import fs from 'fs';
import path from 'path';

import fg from 'fast-glob';
import slash from "slash";

//

export interface Options {
    ignore?: string[];
}

export interface PrintConfig {
    emoji?: (node: FileTreeNode) => string;
}

//

export default class FileTreeNode {
    static async Scan(rootPath: string, patterns: string[], options: Options = {}): Promise<FileTreeNode> {
        rootPath = slash(rootPath);

        //

        const ignore: string[] = (() => {
            if (options.ignore) {
                return options.ignore.map(i => {
                    const fixed = slash(i);

                    if (fixed.endsWith("/"))
                        return fixed.slice(0, -1);
                    else
                        return fixed;
                });
            }

            return [];
        })();

        //

        const fgEntries = await fg(patterns, {
            cwd: rootPath,
            onlyFiles: false,
            dot: true,
            ignore,
            absolute: true,
            stats: true,
        });

        //

        const nodeMap = new Map<string, FileTreeNode>();

        //

        const rootStats = await fs.promises.stat(rootPath);
        const rootNode = new FileTreeNode(rootPath, rootStats);
        nodeMap.set(rootPath, rootNode);

        //

        for (const fgEntry of fgEntries) {
            const node = new FileTreeNode(fgEntry.path, fgEntry.stats!);
            nodeMap.set(fgEntry.path, node);
        }

        //

        for (const node of nodeMap.values()) {
            if (node.absPath === rootPath)
                continue; // Pomijamy root

            //

            const parentPath = path.dirname(node.absPath);
            const parentNode = nodeMap.get(parentPath);

            if (parentNode) {
                parentNode.children.push(node);
            }
            else {
                // Should never happen
                throw new Error(`Warning: parent node not found for ${node.absPath}`);
            }
        }

        //

        // Dodajemy sortowanie dzieci węzłów
        const sortChildren = (node: FileTreeNode) => {
            node.children.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });

            node.children.forEach(sortChildren);
        };

        sortChildren(rootNode);

        //

        return rootNode;
    }

    static GetAllFilesNodes(root: FileTreeNode): FileTreeNode[] {
        const files: FileTreeNode[] = [];
    
        const collectFiles = (node: FileTreeNode) => {
            if (node.isFile) {
                files.push(node);
            }
    
            node.children.forEach(collectFiles);
        };
    
        collectFiles(root);
    
        return files;
    }

    //

    static Print(root: FileTreeNode, config?: PrintConfig) {
        const lines: string[] = [];

        const renderNode = (node: FileTreeNode, prefix: string, isLast: boolean) => {
            const branch = prefix + (isLast ? '└─ ' : '├─ ');

            //

            const emoji = config?.emoji?.(node);

            lines.push(`${branch}${emoji ? `${emoji} ` : ""}${node.name}`);

            const childrenCount = node.children.length;
            node.children.forEach((child, index) => {
                const childIsLast = index === childrenCount - 1;
                const childPrefix = prefix + (isLast ? '    ' : '│   ');
                renderNode(child, childPrefix, childIsLast);
            });
        };

        // Root node (always printed with folder emoji)
        const emoji = config?.emoji?.(root);

        lines.push(`${emoji ? `${emoji} ` : ""}${root.name}`);

        //

        const childrenCount = root.children.length;
        root.children.forEach((child, index) => {
            const isLast = index === childrenCount - 1;
            renderNode(child, '', isLast);
        });

        //

        return lines.join('\n');
    }

    //

    public readonly absPath: string;
    public readonly name: string;

    public readonly stats: fs.Stats;

    public readonly children: FileTreeNode[] = [];

    //

    constructor(fullPath: string, stats: fs.Stats) {
        this.absPath = fullPath;
        this.name = path.basename(fullPath);

        this.stats = stats;
    }

    //

    get isDirectory(): boolean {
        return this.stats.isDirectory();
    }

    get isFile(): boolean {
        return this.stats.isFile();
    }

    get extension(): string {
        return path.extname(this.absPath).replace(/^\./, '');
    }

    get isDirectoryEmpty(): boolean {
        if (!this.isDirectory)
            throw new Error(`Node at ${this.absPath} is not a directory.`);

        return this.children.length === 0;
    }
}
