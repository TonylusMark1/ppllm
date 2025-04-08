import path from "path";
import url from 'url';

//

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//

export const DEFAULT_DIRCONFIG_FILENAME: string = 'ppllm.dirconfig.json';
export const DEFAULT_SETTINGS_FILENAME: string = 'ppllm.settings.json';
export const DEFAULT_OUTPUT_FILENAME: string = 'ppllm.prompt.txt';

export const DEFAULT_GENERATE_TEMPLATE_FILENAME: string = 'default.prompt.hbs';
export const DEFAULT_GENERATE_TEMPLATE_PATH: string = path.resolve(__dirname, "../../assets/templates", DEFAULT_GENERATE_TEMPLATE_FILENAME);