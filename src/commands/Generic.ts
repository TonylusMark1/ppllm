import type PPLLM from '../index.js';

//

export default abstract class CommandGeneric {
    readonly ppllm: PPLLM;

    //

    constructor(ppllm: PPLLM) {
        this.ppllm = ppllm;
    }

    //

	abstract start(): Promise<void>;
}