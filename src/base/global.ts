import path from 'path';
import process from 'process';
import { Command } from 'commander';

import { i18n, Translation } from './i18n.js';
import * as Consts from './consts.js';
import * as Utils from '../helpers/utils.js';

//

interface CLIOptions {
    dir: string;
    config: string;
    preset: string;
    language: string;
    binary: 'none' | 'tree' | 'all';
    maxSize: string;

    save?: string | boolean;
    noConfig?: boolean;
    emoji?: boolean;
}

interface Options {
    cli: CLIOptions;

    maxSizeBytes?: number;

    savePath: string | null;
    dirPath: string;
    configFileName: string | false;
}

//

export const options = GetOptions();
export const T = GetTranslations(options);

//

function GetOptions(): Options {
    const cli = GetCLIOptions();

    //

    const maxSizeBytes = (() => {
        if (cli.maxSize.toLowerCase() === '0' || cli.maxSize.toLowerCase() === 'false')
            return undefined; // brak limitu
    
        //

        try {
            return Utils.ConvertSizeToBytes(cli.maxSize);
        }
        catch (err: any) {
            console.error(`${options.cli.emoji ? `${Consts.EMOJI.error} ` : ''}Invalid value for --max-size: ${cli.maxSize}`);
            process.exit(1);
        }
    })();

    //

    const savePath = (() => {
        if (cli.save) {
            const filename = cli.save === true ? Consts.DEFAULT_SAVE_FILENAME : cli.save;

            return path.resolve(process.cwd(), filename);
        }
        
        return null;
    })();

    const dirPath = path.resolve(process.cwd(), cli.dir);

    //
    
    const configFileName = cli.noConfig ? false : cli.config;

    //

    return {
        cli,

        maxSizeBytes,

        savePath,
        dirPath,
        configFileName
    };
}

function GetCLIOptions(): CLIOptions {
    const program = new Command();

    program
        .option('-d, --dir <dir>', 'Source directory to scan', '.')
        .option('-c, --config <config>', 'Name of the config file', Consts.DEFAULT_CONFIG_FILENAME)
        .option('-s, --save [filename]', 'Save output to a file (optional: pass custom filename)')
        .option('--no-config', 'Disable loading config files entirely')
        .option('-p, --preset <preset>', 'Ignore preset to use: false (none), general, or one of the available presets', 'false')
        .option('-l, --language <language>', `Message language: ${Consts.LANGUAGE_CODES.join(', ')}`, Consts.DEFAULT_LANGUAGE)
        .option('-m, --max-size <size>', 'Set maximum file size to load (e.g. 100KB, 5MB, 1GB, or 0/false for no limit)', '5MB')
        .option('-b, --binary <mode>', 'Binary file mode: none, tree (default), or all', 'tree')
        .option('-e, --emoji', 'Render emoji in prompt');

    program.parse(process.argv);

    const cli: CLIOptions = program.opts();

    //

    if (!['none', 'tree', 'all'].includes(cli.binary)) {
        console.error(`${options.cli.emoji ? `${Consts.EMOJI.error} ` : ''}Invalid value for --binary: ${cli.binary}`);
        process.exit(1);
    }

    //

    return cli;
}

function GetTranslations(options: Options): Translation {
    if ( Consts.LANGUAGE_CODES.includes(options.cli.language) )
        return i18n[options.cli.language];

    console.error(`Unknown language: ${options.cli.language}`);
    process.exit(-1);
}