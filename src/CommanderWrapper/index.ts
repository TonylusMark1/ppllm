import { Command, Option } from 'commander';
import * as colorette from 'colorette';

//

export type ValidationRule<T> =
    | T
    | RegExp
    | { pattern: RegExp; description: string };

export interface OptionConfig<T> {
    flags: string;
    description: string;
    defaultValue?: T;
    validation?: ValidationRule<T>[];
    onValidate?: (value: T) => void;
    valueParser?: (value: string) => any;
}

export interface RegisterOptionMeta {
    groupName?: string;
    tags?: string[];
}

interface RegisteredOption<T> extends OptionConfig<T>, Required<RegisterOptionMeta> {
    commanderOption: Option;
}

interface CommandGroup {
    [groupName: string]: RegisteredOption<any>[];
}

interface CommandMeta {
    commander: Command;
    groups: CommandGroup;
    userProvided: Set<string>;
}

//

export default class CommanderWrapper {
    static readonly UNGROUPED_GROUP_NAME = 'ungrouped';

    //

    private mainProgram = new Command();

    private commands: Map<string, CommandMeta> = new Map();

    private defaultCommand?: string;

    private usedCommand: string = null as any;

    //

    setDefaultCommand(commandName: string) {
        if (!this.commands.has(commandName))
            throw new Error(`Cannot set default command "${commandName}" because it is not registered yet.`);
    
        this.defaultCommand = commandName;
    }

    //

    registerCommand(commandName: string, description: string, opts?: {strictMode?: boolean, isDefault?: boolean}) {
        const command = this.getOrCreateCommand(commandName, opts?.isDefault ?? false);

        command.commander
            .description(description)
            .action(() => {
                this.usedCommand = commandName;
            });

        command.commander.allowUnknownOption(!(opts?.strictMode ?? true));
    }

    registerOption<T>(commandName: string, meta: RegisterOptionMeta, config: OptionConfig<T>) {
        const command = this.getCommand(commandName);

        //

        const groupName = meta.groupName ?? CommanderWrapper.UNGROUPED_GROUP_NAME;
        const tags = meta.tags ?? [];

        //

        const commanderOption = new Option(config.flags, config.description);

        if (config.defaultValue !== undefined)
            commanderOption.default(config.defaultValue);

        //

        if (config.validation) {
            if (commanderOption.isBoolean())
                throw new Error(`Option "${config.flags}" is a boolean flag, but validation was provided.`);

            for (const rule of config.validation) {
                const isDirectValue = typeof rule === 'string' || typeof rule === 'number' || typeof rule === 'boolean';
                const isRegExp = rule instanceof RegExp;
                const isPatternObject =
                    typeof rule === 'object' && rule !== null &&
                    'pattern' in rule && rule.pattern instanceof RegExp &&
                    'description' in rule && typeof rule.description === 'string';

                if (!isDirectValue && !isRegExp && !isPatternObject)
                    throw new Error(`Invalid validation rule for option "${config.flags}": ${JSON.stringify(rule)}.`);
            }
        }

        //

        const option: RegisteredOption<T> = {
            ...config,

            commanderOption,

            groupName,
            tags
        };

        //

        if (commanderOption.isBoolean()) {
            commanderOption.argParser((value: any) => {
                command.userProvided.add(option.commanderOption.attributeName());
                return true;
            });
        }
        else {
            commanderOption.argParser((value: any) => {
                const parsedValue = config.valueParser ? config.valueParser(value) : value;

                this.validateOptionValue(parsedValue, option, false);

                if (option.onValidate)
                    option.onValidate(parsedValue);

                command.userProvided.add(option.commanderOption.attributeName());

                return parsedValue;
            });
        }

        //

        if (option.defaultValue !== undefined)
            this.validateOptionValue(option.defaultValue, option, true);

        //

        this.enhanceDescription(option);

        //

        if (!command.groups[groupName])
            command.groups[groupName] = [];

        command.groups[groupName].push(option);

        //

        command.commander.addOption(commanderOption);

        //

        if (commanderOption.isBoolean()) {
            this.getLongFlagNames(commanderOption).forEach(longFlag => {
                command.commander.option(`--no-${longFlag}`, "", () => {
                    command.userProvided.add(option.commanderOption.attributeName());
                    return false;
                });
            });
        }
    }

    //

    parse(argv?: string[]) {
        this.mainProgram.helpInformation = () => this.generateGlobalHelpText();
        this.mainProgram.parse(argv || process.argv);
    }

    //

    getUsedCommand() {
        return this.usedCommand;
    }

    getOptions<OptionsObjInterface extends Record<string, any> = Record<string, any>>(options?: { onlyUserProvided?: boolean; groupName?: string; tags?: string[] }) {
        const commandName = this.usedCommand;

        if (!commandName)
            throw new Error('No command has been used. Cannot retrieve options.');

        //

        const command = this.getCommand(commandName);
        const opts = command.commander.opts();
        const result: any = {};

        const groups = options?.groupName
            ? { [options.groupName]: command.groups[options.groupName] ?? [] }
            : command.groups;

        for (const groupOptions of Object.values(groups)) {
            for (const option of groupOptions) {
                const hasAllTags = options?.tags ? options.tags.every(tag => option.tags.includes(tag)) : true;
                if (!hasAllTags) continue;

                const optionName = option.commanderOption.attributeName();
                if (!options?.onlyUserProvided || command.userProvided.has(optionName)) {
                    result[optionName] = opts[optionName];
                }
            }
        }

        return result as OptionsObjInterface;
    }

    //

    hasUserSetOption(commandName: string, optionName: string) {
        const command = this.getCommand(commandName);
        return command.userProvided.has(optionName);
    }

    isOptionValueValidForCurrentCommand<T>(optionName: string, value: T): boolean {
        const command = this.getCommand(this.usedCommand);
    
        for (const groupOptions of Object.values(command.groups)) {
            for (const option of groupOptions) {
                if (option.commanderOption.attributeName() === optionName) {
                    return this.isOptionValueValid(value, option);
                }
            }
        }
    
        throw new Error(`Option "${optionName}" not found in command "${this.usedCommand}".`);
    }

    //

    private getCommand(commandName: string) {
        const command = this.commands.get(commandName);

        if (!command)
            throw new Error(`Command "${commandName}" not found.`);

        return command;
    }

    private getOrCreateCommand(commandName: string, isDefault: boolean = false) {
        if (!this.commands.has(commandName)) {
            const commander = this.mainProgram.command(commandName, {isDefault});

            const meta: CommandMeta = {
                commander,
                groups: {},
                userProvided: new Set(),
            };

            // Dodajemy osobny help dla każdej komendy
            commander.helpInformation = () => this.generateHelpTextForCommand(commandName);

            this.commands.set(commandName, meta);
        }

        return this.commands.get(commandName)!;
    }

    private getLongFlagNames(option: Option) {
        const matches = Array.from(option.flags.matchAll(/--([a-zA-Z0-9-]+)/g));
        return matches.map(match => match[1]);
    }

    private validateOptionValue<T>(value: T, option: RegisteredOption<T>, isDefault: boolean) {
        const isValid = this.isOptionValueValid(value, option);

        if (!isValid) {
            const source = isDefault ? 'Default value' : 'Invalid value';
            const allowed = this.formatAllowedValues(option.validation!);

            throw new Error(colorette.red(`${source} for option "${colorette.yellow(option.commanderOption.attributeName())}" is not allowed.\n${colorette.green('Allowed')}: ${allowed}`));
        }
    }

    private isOptionValueValid<T>(value: T, option: RegisteredOption<T>): boolean {
        if (!option.validation || option.validation.length === 0)
            return true;
    
        const isValid = option.validation.some(rule => {
            if (rule instanceof RegExp)
                return rule.test(String(value));
    
            if (typeof rule === 'object' && rule !== null && 'pattern' in rule)
                return rule.pattern.test(String(value));
    
            return rule === value;
        });
    
        return isValid;
    }    

    private enhanceDescription<T>(option: RegisteredOption<T>) {
        const parts: string[] = [];

        parts.push(option.description);

        if (option.defaultValue !== undefined) {
            parts.push(`(${colorette.green('Default')}: ${colorette.yellow(JSON.stringify(option.defaultValue))})`);
        }

        if (option.commanderOption.isBoolean()) {
            const longFlagNames = this.getLongFlagNames(option.commanderOption);

            if (longFlagNames.length > 0) {
                const flags = longFlagNames.map(name => colorette.cyan(`--no-${name}`)).join(', ');
                parts.push(`(${colorette.green('Tip')}: Use ${flags} to explicitly set false)`);
            }
        }

        if (option.validation && option.validation.length > 0) {
            const allowed = this.formatAllowedValues(option.validation);
            parts.push(`(${colorette.green('Allowed')}: ${colorette.yellow(allowed)})`);
        }

        option.description = parts.filter(Boolean).join(' ');
    }

    private formatAllowedValues<T>(validation: ValidationRule<T>[]) {
        return validation
            .map(rule => {
                if (rule instanceof RegExp)
                    return rule.toString();

                if (typeof rule === 'object' && rule !== null && 'pattern' in rule)
                    return `<${rule.description}>`;

                return JSON.stringify(rule);
            })
            .filter(Boolean)
            .join(', ');
    }

    //

    private generateGlobalHelpText(): string {
        const lines: string[] = [];

        //

        lines.push(colorette.bold(`\nAvailable Commands:\n`));

        for (const [commandName, commandMeta] of this.commands.entries()) {
            const description = commandMeta.commander.description() || '';

            lines.push(`  ${colorette.cyan(commandName)}`);

            if (description.trim() !== '')
                lines.push(`    ${description}`);

            lines.push('');
        }

        lines.push(`${colorette.green('Tip')}: For detailed options, use ${colorette.cyan('<command> --help')}\n`);

        //

        return lines.join('\n');
    }

    private generateHelpTextForCommand(commandName: string): string {
        const commandMeta = this.getCommand(commandName);

        //

        const lines: string[] = [];

        //

        lines.push(colorette.bold(`\nOptions for command: ${colorette.cyan(commandName)}\n`));

        //

        const groups = Object.entries(commandMeta.groups);

        if (groups.length === 0) {
            lines.push(colorette.yellow('No options available for this command.\n'));
            return lines.join('\n');
        }

        //

        groups.unshift(["built-in", [{
            groupName: "built-in",

            flags: "-h, --help",
            description: "Show help",
            tags: [],

            commanderOption: null as any
        }]]);

        //

        const allOptions = groups.flatMap(([, options]) => options);
        const flagPadding = Math.max(...allOptions.map(opt => opt.flags.length)) + 2;

        for (const [groupName, options] of groups) {
            lines.push(colorette.underline(`${groupName}:`) + "\n");

            for (const option of options) {
                const flags = colorette.cyan(option.flags.padEnd(flagPadding));
                lines.push(`  ${flags} ${option.description}`);
            }

            lines.push('');
        }

        lines.push('');

        //

        return lines.join('\n');
    }
}