import type PPLLM from './index.js';

//

export default class Logger {
    private readonly ppllm: PPLLM;

    //

    constructor(ppllm: PPLLM) {
        this.ppllm = ppllm;
    }

    //

    log(emoji?: string, ...args: unknown[]) {
        emoji = this.ppllm.settingsHandler.settings.emoji ? emoji : undefined;

        if (emoji)
            console.log(emoji, ...args);
        else
            console.log(...args);
    }

    error(emoji?: string, ...args: unknown[]) {
        emoji = this.ppllm.settingsHandler.settings.emoji ? emoji : undefined;

        if (emoji)
            console.error(emoji, ...args);
        else
            console.error(...args);
    }
}