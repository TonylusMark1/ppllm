import path from 'path';
import fs from 'fs';
import process from 'process';

import { Minimatch } from 'minimatch';

import * as Emoji from '../../global/emoji.js';

import * as Utils from '../../helpers/utils.js';

import DirConfig from '../../DirConfig.js';
import type PPLLM from '../../index.js';

import CommandGeneric from "../Generic.js";

import TreeScanner from './TreeScanner.js';
import PromptGenerator from './PromptGenerator.js';

//

export default class CommandGenerate extends CommandGeneric {
    readonly absoluteSourceDirectory: string;
    readonly absoluteOutputPath: string | null;

    readonly treeScanner = new TreeScanner(this);
    readonly promptGenerator = new PromptGenerator(this);

    //

    constructor(ppllm: PPLLM) {
        super(ppllm);

        //

        this.absoluteSourceDirectory = path.resolve(process.cwd(), this.ppllm.cli.o.dir);
        this.absoluteOutputPath = path.resolve(process.cwd(), this.ppllm.cli.settings.o.file);
    }

    //

    async start() {
        try {
            const presetMatchers = await this.loadPresetMatchers();

            const dirNode = await this.treeScanner.scanDir(this.absoluteSourceDirectory, presetMatchers);

            const prompt = await this.promptGenerator.generate(dirNode);

            this.outputResult(prompt);
        }
        catch (err) {
            console.error(`${this.ppllm.cli.settings.o.emoji ? `${Emoji.General.Error} ` : ''}${this.ppllm.T.error}`, err);
        }
    }

    //

    private async loadPresetMatchers() {
        const presetPatterns = (
            (await this.ppllm.presetLoader.load(this.ppllm.cli.settings.o.preset))
                .map(p => path.resolve(this.absoluteSourceDirectory, p))
        );

        return this.buildIgnoreMatchers(this.absoluteSourceDirectory, this.absoluteSourceDirectory, presetPatterns);
    }

    //

    private outputResult(prompt: string) {
        if (!this.absoluteOutputPath) {
            process.stdout.write(prompt, 'utf8');
        }
        else {
            fs.writeFileSync(this.absoluteOutputPath, prompt, 'utf8');

            const relPath = path.relative(process.cwd(), this.absoluteOutputPath);
            const displayPath = relPath.startsWith('..') ? this.absoluteOutputPath : `./${relPath}`;

            console.log(`${this.ppllm.cli.settings.o.emoji ? `${Emoji.General.Saved} ` : ''}${this.ppllm.T.promptSuccessFile(displayPath)}`);
        }
    }

    //

    buildIgnoreMatchers(rootDir: string, dir: string, ignorePatterns: string[]): Minimatch[] {
        return ignorePatterns.map(p => {
            const patternAbsolute = path.resolve(dir, p);
            const relativeToRoot = path.relative(rootDir, patternAbsolute);

            const pattern = Utils.ConvertPathToPOSIX(relativeToRoot);

            return new Minimatch(pattern, {
                dot: true,
                matchBase: false
            });
        });
    }

    //

    readDirConfigFile(cfgPath: string) {
        const directory = path.dirname(cfgPath);

        //

        try {
            const content = fs.readFileSync(cfgPath, 'utf8');
            const dirconfig = JSON.parse(content) as DirConfig;

            if (Array.isArray(dirconfig.ignore))
                dirconfig.ignore = dirconfig.ignore.map(p => path.resolve(directory, p));

            return dirconfig;
        }
        catch {
            return undefined;
        }
    }
}