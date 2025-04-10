import type PPLLM from './index.js';

//

export default class Logger {
    private readonly ppllm: PPLLM;

    //

    constructor(ppllm: PPLLM) {
        this.ppllm = ppllm;
    }

    //

    log(...args: unknown[]) {
        console.log(...args);
    }

    error(...args: unknown[]) {
        console.error(...args);
    }
}