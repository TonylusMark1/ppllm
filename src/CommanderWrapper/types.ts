import { Command, Option } from 'commander';

//

export type ValidationRule<T> =
    | (T extends any[] ? never : T)
    | RegExp
    | { pattern: RegExp; description: string };

//

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

export interface RegisteredOption<T> extends OptionConfig<T>, Required<RegisterOptionMeta> {
    commanderOption: Option;
}

//

export interface RegisterCommandOptions {
    strictMode?: boolean;
    isDefault?: boolean;
    arguments?: CommandArgument[];
}

export interface CommandArgument {
    name: string;
    required?: boolean;
    parser?: (value: string) => any;
    validation?: ValidationRule<any>[];
}

export interface CommandGroup {
    [groupName: string]: RegisteredOption<any>[];
}

export interface CommandMeta {
    commander: Command;
    groups: CommandGroup;
    userProvidedOptions: Set<string>;
    arguments: { config: CommandArgument; value: any }[];
}

//

export type ScopedRegisterOptionCallback = <T>(meta: RegisterOptionMeta, config: OptionConfig<T>) => void;