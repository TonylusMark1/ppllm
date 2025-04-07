import * as Emoji from "../../global/emoji.js";

import type DirConfig from "../../DirConfig.js"

//

export class TreeNode {
    static Flatten(nodes: TreeNode[]): TreeNodeFile[] {
        let result: TreeNodeFile[] = [];

        for (const node of nodes) {
            if (node instanceof TreeNodeDir && node.files.length > 0) {
                result = result.concat(this.Flatten(node.files));
            }
            else if (node instanceof TreeNodeFile) {
                result.push(node);
            }
        }

        return result;
    }

    //

    readonly relativePath: string;
    readonly absolutePath: string;
    readonly fileName: string;

    //

    constructor(relativePath: string, absolutePath: string, fileName: string) {
        this.relativePath = relativePath;
        this.absolutePath = absolutePath;
        this.fileName = fileName;
    }

    //

    get emoji(): string {
        throw new Error("Unimplemented");
    }
}

export class TreeNodeDir extends TreeNode {
    readonly files: TreeNode[] = [];
    readonly dirconfig?: DirConfig;

    //

    constructor(relativePath: string, absolutePath: string, fileName: string, dirconfig?: DirConfig) {
        super(relativePath, absolutePath, fileName);

        //

        this.dirconfig = dirconfig;
    }

    //

    get isEmptyDir(): boolean {
        return this.files?.length === 0;
    }


    get emoji() {
        return this.isEmptyDir ? Emoji.Files.General.EmptyFolder : Emoji.Files.General.Folder;
    }
}

export class TreeNodeFile extends TreeNode {
    readonly isBinary: boolean;

    //

    constructor(relativePath: string, absolutePath: string, fileName: string, isBinary = false) {
        super(relativePath, absolutePath, fileName);

        //

        this.isBinary = isBinary;
    }

    //

    get ext(): string | null {
        const idx = this.fileName.lastIndexOf('.');

        if (idx === -1 || idx === this.fileName.length - 1)
            return null;

        return this.fileName.slice(idx + 1).toLowerCase();
    }


    get emoji() {
        let emoji = '';

        if (this.ext && Emoji.Files.PerExt[this.ext]) {
            emoji = Emoji.Files.PerExt[this.ext];
        }
        else {
            emoji = this.isBinary ? Emoji.Files.General.AnyBinaryFile : Emoji.Files.General.AnyNonBinaryFile;
        }

        return emoji;
    }
}