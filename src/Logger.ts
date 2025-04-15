import StringWidth from 'string-width';

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

    //

    logEmptyLine() {
        this.log('');
    }

    logBoxedMessage(message: string) {
        const length = StringWidth(message);
        const horizontal = '═'.repeat(length + 2); // +2 na spacje w ramce
    
        this.log(`╔${horizontal}╗`);
        this.log(`║ ${message} ║`);
        this.log(`╚${horizontal}╝`);
    }
}