import { Command, Option } from 'commander';

//

export type ValidationRulePrimitives = string | number | boolean | undefined;
export type ValidationRule = RegExp | RegExpWithDescription | ValidationRulePrimitives;

export interface ValidationMapping {
    value?: unknown; // bez podania będzie zwracać oryginalną wartość
    rules: ValidationRule[];
}

export type Validation = ValidationRule | ValidationRule[] | ValidationMapping[];

export type DefaultValue = string | number | boolean;

//

export interface RegExpWithDescription {
    regexp: RegExp;
    description: string;
}

//

export interface RegOption {
    flags: string;
    description: string;

    validation?: Validation;

    defaultValue?: DefaultValue;
}

//

export class InvalidValueError extends Error { }

//

export default class CommanderWrapper {
    private program: Command;

    //

    constructor() {
        this.program = new Command();
    }

    //

    private isMappingArray(schema: Validation): schema is ValidationMapping[] {
        return Array.isArray(schema) &&
            schema.length > 0 &&
            typeof (schema[0] as any).rules !== 'undefined';
    }

    private isRegExpWithDescription(rule: RegExp | RegExpWithDescription): rule is RegExpWithDescription {
        if (rule instanceof RegExp)
            return false;

        return rule !== null && rule.regexp instanceof RegExp;
    }

    //

    /**
     * Dodaje opcję do CLI z walidacją wartości
     */
    registerOption(regOpt: RegOption): this {
        const option = new Option(regOpt.flags, regOpt.description);

        //

        if (regOpt.defaultValue !== undefined)
            option.default(regOpt.defaultValue);

        if (regOpt.validation) {
            const validation = regOpt.validation;

            if (option.required || option.optional) {
                const validationInfo = this.buildValidationDescription(validation);
                option.description = `${regOpt.description} (Allowed ${validationInfo})`;
            }

            option.argParser((input: string) => {
                try {
                    const validatedValue = this.validateInput(input, validation);
                    return validatedValue;
                }
                catch (err) {
                    if (err instanceof InvalidValueError)
                        err.message = `(${regOpt.flags}) ${err.message}`;

                    throw err;
                }
            });

            // Dodatkowo sprawdzamy domyślną wartość przy dodaniu opcji
            if (regOpt.defaultValue !== undefined) {
                try {
                    this.validateInput(regOpt.defaultValue.toString(), validation, true);
                }
                catch (err) {
                    if (err instanceof InvalidValueError)
                        err.message = `(${regOpt.flags}) DefaultValue: ${err.message}`;

                    throw err;
                }
            }
        }

        this.program.addOption(option);

        return this;
    }

    /**
     * Parsuje argumenty CLI
     */
    parse() {
        this.program.parse(process.argv);
    }

    /**
     * Zwraca sparsowane opcje
     */
    getOptions() {
        return this.program.opts();
    }

    getOptionValue(attributeName: string) {
        return this.program.getOptionValue(attributeName);
    }

    getOptionUserValue(attributeName: string): boolean | string | null {
        const { value, source } = this.getOptionValueSourceObj(attributeName);

        return source == "cli" ? value : null;
    }

    getOptionValueSourceObj(attributeName: string) {
        const value = this.program.getOptionValue(attributeName);
        const source = this.program.getOptionValueSource(attributeName);

        return { value, source };
    }

    /**
     * Waliduje pojedynczą wartość względem schematu walidacyjnego
     */
    private validateInput(input: string, schema: Validation, forDefaultValue?: boolean) {
        if (this.isMappingArray(schema)) {
            for (const { value, rules } of schema) {
                for (const rule of rules) {
                    if (this.matchesRule(input, rule))
                        return value;
                }
            }

            const indent = '    ';
            const allowedValues = schema
                .map(mapping => {
                    const { value, rules } = mapping;

                    const formattedRules = this.formatSchema(rules, { indent, separator: ';\n' + indent, ignoreAllowEmpty: forDefaultValue });
                    if ('value' in mapping)
                        return `  ${value}:\n${formattedRules}`;
                    else
                        return `  any of these:\n${formattedRules}`
                })
                .join('\n');

            throw new InvalidValueError(`Invalid value "${input}". Expected one of:\n${allowedValues}`);
        }
        else if (!Array.isArray(schema)) {
            if (this.matchesRule(input, schema))
                return input;

            const formattedRules = this.formatSchema([schema], { ignoreAllowEmpty: forDefaultValue });

            throw new InvalidValueError(`Invalid value "${input}". Expected: ${formattedRules}`);
        }
        else {
            for (const rule of schema) {
                if (this.matchesRule(input, rule))
                    return input;
            }

            const formattedRules = this.formatSchema(schema, { ignoreAllowEmpty: forDefaultValue });

            throw new InvalidValueError(`Invalid value "${input}". Expected one of: ${formattedRules}`);
        }
    }

    /**
     * Sprawdza, czy wartość pasuje do reguły walidacji
     */
    private matchesRule(input: string | undefined, rule: ValidationRule) {
        if (rule === undefined) {
            return input === undefined;
        }
        else if (typeof rule == "object") {
            if (this.isRegExpWithDescription(rule))
                return typeof input === 'string' && rule.regexp.test(input);

            if (rule instanceof RegExp)
                return typeof input === 'string' && rule.test(input);
        }

        //

        return input === String(rule);
    }

    /**
     * Formatowanie schematu do wiadomości błędu
     */
    private formatSchema(rules: ValidationRule[], options?: { indent?: string, separator?: string, ignoreAllowEmpty?: boolean }) {
        const indent = options?.indent ?? '';
        const separator = options?.separator ?? '; ';

        //

        const literals: ValidationRulePrimitives[] = [];
        const patterns: string[] = [];
        let allowEmpty = false;

        for (const rule of rules) {
            if (rule === undefined) {
                allowEmpty = true;
            }
            else if (typeof rule == "object" && this.isRegExpWithDescription(rule)) {
                patterns.push(`<${rule.description}>`);
            }
            else if (typeof rule == "object" && rule instanceof RegExp) {
                patterns.push(rule.toString());
            }
            else {
                literals.push(JSON.stringify(rule));
            }
        }

        //

        const parts: string[] = [];

        if (literals.length > 0)
            parts.push(`${indent}values [${literals.join(', ')}]`);

        if (patterns.length > 0)
            parts.push(`${indent}patterns [${patterns.join(', ')}]`);

        if (allowEmpty && !options?.ignoreAllowEmpty)
            parts.push(`${indent}[no value] allowed (use just the flag)`);

        return parts.join(separator);
    }

    //

    /**
     * Buduje opis dopuszczalnych wartości na podstawie walidacji
     */
    private buildValidationDescription(schema: Validation): string {
        if (this.isMappingArray(schema)) {
            return schema
                .map(mapping => {
                    const { value, rules } = mapping;

                    const formattedRules = this.formatSchema(rules, { separator: ', ' });

                    if ('value' in mapping)
                        return `${value}: ${formattedRules}`;
                    else
                        return `any of these: ${formattedRules}`
                })
                .join('; ');
        }
        else if (!Array.isArray(schema)) {
            return this.formatSchema([schema], { separator: ', ' });
        }
        else {
            return this.formatSchema(schema, { separator: ', ' });
        }
    }
}
