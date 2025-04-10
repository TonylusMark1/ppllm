export const REGEXP_FILENAME = /^[^\\/\\0]+(?:\.[a-zA-Z0-9_\-]+)?$/;
export const REGEXP_FILE_PATH = /^(?:\.{0,2}[\\/])?(?:[^\\/\\0]+[\\/])*[^\\/\\0]+(?:\.[a-zA-Z0-9_\-]+)?$/;
export const REGEXP_DIRECTORY_PATH = /^(?:\.{1,2}|(?:\.{0,2}[\\/])?(?:[^\\/\\0]+(?:[\\/]|$))+)$/;

//

export const DEFAULT_CONFIG_FILENAME: string = 'ppllm.config.json';
export const DEFAULT_OUTPUT_FILENAME: string = 'ppllm.prompt.txt';