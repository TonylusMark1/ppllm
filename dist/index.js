#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { options, T } from './base/global.js';
import * as Consts from './base/consts.js';
import * as Utils from './helpers/utils.js';
import { LoadPreset } from './helpers/presetLoader.js';
import FileTreeScanner from './TreeScanner.js';
import PromptGen from './PromptGen.js';
//
class PPLLM {
    static async Main() {
        try {
            const presetMatchers = await this.LoadPresetMatchers();
            const dirNode = await FileTreeScanner.ScanDir(options.dirPath, presetMatchers);
            const prompt = await PromptGen.Generate(dirNode);
            await this.OutputResult(prompt);
        }
        catch (err) {
            console.error(`${options.cli.emoji ? `${Consts.EMOJI.error} ` : ''}${T.error}`, err);
        }
    }
    //
    static async LoadPresetMatchers() {
        const presetPatterns = await LoadPreset(options.cli.preset, options.dirPath);
        return Utils.BuildIgnoreMatchers(options.dirPath, options.dirPath, presetPatterns);
    }
    //
    static async OutputResult(prompt) {
        if (!options.savePath) {
            process.stdout.write(prompt, 'utf8');
        }
        else {
            await fs.writeFile(options.savePath, prompt, 'utf8');
            const relPath = path.relative(process.cwd(), options.savePath);
            const displayPath = relPath.startsWith('..') ? options.savePath : `./${relPath}`;
            console.log(`${options.cli.emoji ? `${Consts.EMOJI.success} ` : ''}${T.successFile(displayPath)}`);
        }
    }
}
PPLLM.Main();
