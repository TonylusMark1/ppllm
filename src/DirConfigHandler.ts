import path from "path";
import fs from "fs";

import type PPLLM from './index.js';

//

export interface DirConfig {
    prompt?: string;
    ignore?: string[];
}

//

export default class DirConfigHandler {
    private readonly ppllm: PPLLM;

    //

    constructor(ppllm: PPLLM) {
        this.ppllm = ppllm;
    }

    //

    read(dircfgPath: string) {
        const directory = path.dirname(dircfgPath);

        //

        try {
            const content = fs.readFileSync(dircfgPath, 'utf8');
            const dirconfig = JSON.parse(content) as DirConfig;

            //

            if (Array.isArray(dirconfig.ignore))
                dirconfig.ignore = dirconfig.ignore.map(p => path.resolve(directory, p));

            //

            return dirconfig;
        }
        catch {
            return undefined;
        }
    }
}