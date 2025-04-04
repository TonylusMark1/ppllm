import path from 'path';
import process from 'process';
import { Command } from 'commander';
import { i18n } from './i18n.js';
import * as Consts from './consts.js';
import * as Utils from '../helpers/utils.js';
//
export const options = GetOptions();
export const T = GetTranslations(options);
//
function GetOptions() {
    const cli = GetCLIOptions();
    //
    const maxSizeBytes = (() => {
        if (cli.maxSize.toLowerCase() === '0' || cli.maxSize.toLowerCase() === 'false')
            return undefined; // brak limitu
        //
        try {
            return Utils.ConvertSizeToBytes(cli.maxSize);
        }
        catch (err) {
            console.error(`${options.cli.emoji ? `${Consts.EMOJI.error} ` : ''}Invalid value for --max-size: ${cli.maxSize}`);
            process.exit(1);
        }
    })();
    //
    const dirPath = path.resolve(process.cwd(), cli.dir);
    const outputPath = path.resolve(process.cwd(), cli.file);
    //
    const configFileName = cli.noConfig ? false : cli.config;
    //
    return {
        cli,
        maxSizeBytes,
        dirPath,
        outputPath,
        configFileName
    };
}
function GetCLIOptions() {
    const program = new Command();
    program
        .option('-d, --dir <dir>', 'Source directory to scan', '.')
        .option('-o, --output <mode>', 'Output mode: file (default) or stdout', 'file')
        .option('-f, --file [filename]', 'Filename for output file (default: ppllm.prompt.txt)', Consts.DEFAULT_OUTPUT_FILENAME)
        .option('-p, --preset <preset>', 'Ignore preset to use: false (none), general, or one of the available presets', 'false')
        .option('-c, --config <config>', 'Name of the config file', Consts.DEFAULT_CONFIG_FILENAME)
        .option('-m, --max-size <size>', 'Set maximum file size to load (e.g. 100KB, 5MB, 1GB, or 0/false for no limit)', '5MB')
        .option('-b, --binary <mode>', 'Binary file mode: none, tree (default), or all', 'tree')
        .option('-l, --language <language>', `Message language: ${Consts.LANGUAGE_CODES.join(', ')}`, Consts.DEFAULT_LANGUAGE)
        .option('-e, --emoji', 'Render emoji in prompt')
        .option('-s, --store', 'Store used settings into root config')
        .option('--no-config', 'Disable loading config files entirely');
    program.parse(process.argv);
    const cli = program.opts();
    //
    cli.emoji = (() => {
        if (typeof cli.emoji === 'string') {
            if (['true', 'yes', 'y', 'enable', 'enabled'].includes(cli.emoji.toLowerCase()))
                return true;
            else
                return false;
        }
        else
            return Boolean(cli.emoji);
    })();
    //
    if (!['none', 'tree', 'all'].includes(cli.binary)) {
        console.error(`${options.cli.emoji ? `${Consts.EMOJI.error} ` : ''}Invalid value for --binary: ${cli.binary}`);
        process.exit(1);
    }
    //
    // Walidacja output mode
    if (!['file', 'stdout'].includes(cli.output)) {
        console.error(`${options.cli.emoji ? `${Consts.EMOJI.error} ` : ''}Invalid value for --output: ${cli.output}`);
        process.exit(1);
    }
    //
    return cli;
}
function GetTranslations(options) {
    if (Consts.LANGUAGE_CODES.includes(options.cli.language))
        return i18n[options.cli.language];
    console.error(`Unknown language: ${options.cli.language}`);
    process.exit(-1);
}
