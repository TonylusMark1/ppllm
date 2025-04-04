import { i18n } from './i18n.js';

//

export const DEFAULT_LANGUAGE: string = 'eng';
export const LANGUAGE_CODES: string[] = Object.keys(i18n);

export const DEFAULT_SETTINGS_FILENAME: string = 'ppllm.settings.json';
export const DEFAULT_CONFIG_FILENAME: string = 'ppllm.config.json';
export const DEFAULT_OUTPUT_FILENAME: string = 'ppllm.prompt.txt';

export const EMOJI = {
    fileStructure: '🌳',
    innerPromptsHeader: '🧠',
    fileContents: '📚',
    error: '❌',
    success: '✅',
    saved: '💾',
};