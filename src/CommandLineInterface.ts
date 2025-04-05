import process from 'process';
import { Command } from 'commander';

import * as Consts from './global/consts.js';
import * as Emoji from './global/emoji.js';

//

export interface CLIOptions extends Partial<CLISettingsOptions> {
    dir: string;
    output: "file" | "stdout";
    dirconfig: string;
    settings: string;
    store: boolean;
}

export interface CLISettingsOptions {
    file: string;
    preset: string;
    maxSize: string;
    binary: "none" | "tree" | "all";
    language: string;
    emoji: boolean;
}

//

export const CLISettingsOptionsDefaults: CLISettingsOptions = {
    file: Consts.DEFAULT_OUTPUT_FILENAME,
    preset: "false",
    maxSize: "5MB",
    binary: "tree",
    language: Consts.DEFAULT_LANGUAGE,
    emoji: false,
}

//

export default class CommandLineInterface {
    static Get(): CLIOptions {
        const cmd = new Command();

        //

        cmd
            .option('-d, --dir <dir>', 'Source directory to scan', '.')
            .option('-o, --output <mode>', 'Output mode: file (default) or stdout', 'file')
            .option('-c, --dirconfig <dirconfig>', 'Name of the dirconfig file', Consts.DEFAULT_DIRCONFIG_FILENAME)
            .option('-S, --settings <settings>', 'Name of the settings file', Consts.DEFAULT_SETTINGS_FILENAME)
            .option('-s, --store', 'Store used settings into file in cwd', false)

            .option('-f, --file [filename]', 'Filename for output file (default: ppllm.prompt.txt)')
            .option('-p, --preset <preset>', 'Ignore preset to use: false (none), general, or one of the available presets')
            .option('-m, --max-size <size>', 'Set maximum file size to load (e.g. 100KB, 5MB, 1GB, or 0/false for no limit)')
            .option('-b, --binary <mode>', 'Binary file mode: none, tree (default), or all')
            .option('-l, --language <language>', `Message language: ${Consts.LANGUAGE_CODES.join(', ')}`)
            .option('-e, --emoji [choice]', 'Render emoji in prompt, leave empty for enabling or type no/false/disable for disabling');

        //

        cmd.parse(process.argv);

        const cli: CLIOptions = cmd.opts();

        //

        if (cli.emoji !== undefined) {
            if (typeof cli.emoji === "string") {
                if (["true", "yes", "y", "enable", "enabled"].includes((cli.emoji as string).toLowerCase()))
                    cli.emoji = true;
                else
                    cli.emoji = false;
            }
        }

        if (cli.binary) {
            if (!['none', 'tree', 'all'].includes(cli.binary)) {
                console.error(`${cli.emoji ? `${Emoji.General.Error} ` : ''}Invalid value for --binary: ${cli.binary}`);
                process.exit(1);
            }
        }

        if (!['file', 'stdout'].includes(cli.output)) {
            console.error(`${cli.emoji ? `${Emoji.General.Error} ` : ''}Invalid value for --output: ${cli.output}`);
            process.exit(1);
        }

        //

        return cli;
    }
}