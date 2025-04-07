import * as Consts from './global/consts.js';

import CommanderWrapper from './CommanderWrapper/index.js';

import { SettingsCLIOptions } from './Settings.js';

import type PPLLM from './index.js';
import Settings from './Settings.js';

//

export interface Options extends Partial<SettingsCLIOptions> {
    dir: string;
    output: "stdout" | "file";
    dirconfig: string;
    settings: string;
    store: boolean;
}

//

export default class CLI {
    private readonly ppllm: PPLLM;

    readonly cmderw: CommanderWrapper;

    readonly o: Options;

    readonly settings: Settings;

    //

    constructor(ppllm: PPLLM) {
        this.ppllm = ppllm;

        //

        this.cmderw = new CommanderWrapper();

        this.initCommands();

        this.cmderw.parse();

        //

        this.o = this.getOptions();

        console.log(this.cmderw.getUsedCommand());
        console.log(this.o);
        process.exit(-1);

        //

        this.settings = new Settings(this);
    }

    //

    getCommand() {
        return this.cmderw.getUsedCommand();
    }

    getOptions() {
        return this.cmderw.getOptions<Options>();
    }

    //

    private initCommands() {
        this.cmderw.registerCommand('gen', 'Generate prompt', {isDefault: true});

        this.initOptionsForGenCommand();

        this.cmderw.registerCommand('preset', 'Show ignore list of choosen preset');

        this.initOptionsForPresetCommand();
    }

    private initOptionsForGenCommand() {
        this.cmderw.registerOption(
            "gen",
            { groupName: "general" },
            {
                flags: '-d, --dir <dir>',
                description: 'Source directory to scan.',
                defaultValue: '.',

                validation: [{ pattern: /^.+$/i, description: "directory path" }],
            }
        );
        this.cmderw.registerOption(
            "gen",
            { groupName: "general" },
            {
                flags: '-o, --output <mode>',
                description: `Output mode, default is file.`,
                defaultValue: 'file',

                validation: ["stdout", "file"],
                valueParser: (x: string) => x.toLowerCase(),
            }
        );
        this.cmderw.registerOption(
            "gen",
            { groupName: "general" },
            {
                flags: '-c, --dirconfig <dirconfig>',
                description: 'Name of the dirconfig file.',
                defaultValue: Consts.DEFAULT_DIRCONFIG_FILENAME,

                validation: [{ pattern: /^.+$/i, description: "filename string" }],
            }
        );
        this.cmderw.registerOption(
            "gen",
            { groupName: "general" },
            {
                flags: '-S, --settings <filename>',
                description: 'Name of the settings file.',
                defaultValue: Consts.DEFAULT_SETTINGS_FILENAME,

                validation: [{ pattern: /^.+$/i, description: "filename string" }],
            }
        );
        this.cmderw.registerOption(
            "gen",
            { groupName: "general" },
            {
                flags: '-s, --store',
                description: 'Store used settings into file in cwd.',
                defaultValue: false,
            }
        );

        //

        this.cmderw.registerOption(
            "gen",
            { groupName: "settings" },
            {
                flags: '-f, --file <filename>',
                description: `Filename for output file.`,
                defaultValue: Consts.DEFAULT_OUTPUT_FILENAME,

                validation: [{ pattern: /^.+$/i, description: "filename string" }],
            }
        );
        this.cmderw.registerOption(
            "gen",
            { groupName: "settings" },
            {
                flags: '-p, --preset <preset>',
                description: 'Preset of ignore list to use',
                defaultValue: "disable",

                validation: ["disable", "general", ...this.ppllm.presetLoader.list()],
                valueParser: (x: string) => x.toLowerCase(),
            }
        );
        this.cmderw.registerOption(
            "gen",
            { groupName: "settings" },
            {
                flags: '-m, --max-size <size>',
                description: 'Set maximum file size to load.',
                defaultValue: "disable",

                validation: ["disable", { pattern: /^[0-9]+(KB|MB|GB)$/i, description: "e.g. 100KB, 5MB, 1GB" }],
                valueParser: (x: string) => x.toLowerCase(),
            }
        );
        this.cmderw.registerOption(
            "gen",
            { groupName: "settings" },
            {
                flags: '-b, --binary <mode>',
                description: `Binary file mode.`,
                defaultValue: "tree",

                validation: ["none", "tree", "all"],
                valueParser: (x: string) => x.toLowerCase(),
            }
        );
        this.cmderw.registerOption(
            "gen",
            { groupName: "settings" },
            {
                flags: '-l, --language <code>',
                description: `Prompt & messages language.`,
                defaultValue: Consts.DEFAULT_LANGUAGE,

                validation: Consts.LANGUAGE_CODES,
                valueParser: (x: string) => x.toLowerCase(),
            }
        );
        this.cmderw.registerOption(
            "gen",
            { groupName: "settings" },
            {
                flags: '-e, --emoji',
                description: `Render emoji in prompt.`,
                defaultValue: false,
            }
        );
    }

    private initOptionsForPresetCommand() {
    }
}