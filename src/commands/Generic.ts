import {ScopedRegisterOptionCallback, CommandPositionalArgumentConfig} from 'commanderwrapper';

import type PPLLM from '@/src/index.js';

//

export default class CommandGeneric<Options extends Record<string, any> = Record<string, any>> {
    static get Name(): string {
        throw new Error(`Command class ${this.name} hasn't Name overloaded.`);
    }

    static get Description(): string {
        throw new Error(`Command class ${this.name} hasn't Description overloaded.`);
    }

    static Arguments(): CommandPositionalArgumentConfig[] {
        return [];
    }

    static Options(option: ScopedRegisterOptionCallback, ppllm: PPLLM): void {
    }

    //

    readonly ppllm: PPLLM;

    readonly o: Options;

    //

    constructor(ppllm: PPLLM) {
        this.ppllm = ppllm;

        this.o = this.ppllm.cmderw.getOptions();
    }

    //

	start(): Promise<void> {
        throw new Error("Unimplemented");
    };
}