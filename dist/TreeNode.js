import * as ExtEmojis from "./helpers/extEmojis.js";
//
export class TreeNode {
    static Flatten(nodes) {
        let result = [];
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
    relativePath;
    absolutePath;
    fileName;
    //
    constructor(relativePath, absolutePath, fileName) {
        this.relativePath = relativePath;
        this.absolutePath = absolutePath;
        this.fileName = fileName;
    }
    //
    get emoji() {
        throw new Error("Unimplemented");
    }
}
export class TreeNodeDir extends TreeNode {
    files = [];
    config;
    //
    constructor(relativePath, absolutePath, fileName, config) {
        super(relativePath, absolutePath, fileName);
        //
        this.config = config;
    }
    //
    get isEmptyDir() {
        return this.files?.length === 0;
    }
    get emoji() {
        return this.isEmptyDir ? ExtEmojis.emptyFolder : ExtEmojis.folder;
    }
}
export class TreeNodeFile extends TreeNode {
    isBinary;
    //
    constructor(relativePath, absolutePath, fileName, isBinary = false) {
        super(relativePath, absolutePath, fileName);
        //
        this.isBinary = isBinary;
    }
    //
    get ext() {
        const idx = this.fileName.lastIndexOf('.');
        if (idx === -1 || idx === this.fileName.length - 1)
            return null;
        return this.fileName.slice(idx + 1).toLowerCase();
    }
    get emoji() {
        let emoji = '';
        if (this.ext && ExtEmojis.specific[this.ext]) {
            emoji = ExtEmojis.specific[this.ext];
        }
        else {
            emoji = this.isBinary ? ExtEmojis.anyBinaryFile : ExtEmojis.anyNonBinaryFile;
        }
        return emoji;
    }
}
