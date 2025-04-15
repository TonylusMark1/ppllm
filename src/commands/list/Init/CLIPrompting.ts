import inquirer from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';

import * as colorette from 'colorette';
import Choice from 'inquirer/lib/objects/choice.js';

//

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

//

export interface CLIPromptingOptions {
    defaultValue?: any;
}

export interface CLIPromptingInputOptions extends CLIPromptingOptions {
    validator?: (input: any) => boolean | string;
}

export interface CLIPromptingListWithInputOptions extends CLIPromptingInputOptions {
    placeholder?: string;
}

//

export interface CLIPromptingInputChoice {
    name?: string;
    short?: string;
    description?: string;
    marking?: string;
    value: any;
}

//

export default class CLIPrompting {
    private static MapChoices(choices: CLIPromptingInputChoice[]) {
        return choices.map(choice => this.MapChoice(choice));
    }

    private static MapChoice(choice: CLIPromptingInputChoice) {
        return {
            name: (
                "- " + (choice.name ?? choice.value) +
                (choice.description ? ` - ${colorette.italic(choice.description)}` : '') +
                (choice.marking ? ` ${colorette.italic(colorette.dim(choice.marking))}` : '')
            ),
            short: choice.short ?? choice.value,
            value: choice.value,
        };
    }

    //

    static async PromptStringInput(message: string, options?: CLIPromptingInputOptions) {
        const { input } = await inquirer.prompt([
            {
                prefix: "",
                type: 'input',
                name: 'input',
                message: message,
                default: options?.defaultValue,
                validate: (input: string) => {
                    if (!options?.validator)
                        return true;

                    return options.validator(input) || 'Invalid value, try again.';
                },
            },
        ]);

        return input;
    }

    static async PromptChoiceInput(message: string, choices: CLIPromptingInputChoice[], options?: CLIPromptingOptions) {
        const { input } = await inquirer.prompt([
            {
                prefix: "",
                type: 'list',
                name: 'input',
                message: message,
                choices: this.MapChoices(choices),
                pageSize: Math.max(Math.min(10, choices.length ), 5),
                default: options?.defaultValue
            },
        ]);

        return input;
    }

    static async PromptChoiceWithCustomInput(message: string, choices: CLIPromptingInputChoice[], options?: CLIPromptingListWithInputOptions) {
        const mappedChoices = this.MapChoices(choices)

        //

        const { input } = await inquirer.prompt([
            {
                prefix: "",
                type: 'autocomplete',
                name: 'input',
                message: message,
                source: (answersSoFar: any, input: string) => {
                    input = input ?? "";

                    const filtered = mappedChoices.filter(choice =>
                        (choice.name ?? choice.value).toLowerCase().includes(input.toLowerCase())
                    );

                    const customChoice = {
                        name: colorette.italic(`[${options?.placeholder ?? "custom value"}]`),
                        short: input,
                        value: input
                    };

                    //

                    return [...filtered, this.MapChoice(customChoice)];
                },
                pageSize: Math.max(Math.min(10, choices.length + 1), 5),
                default: options?.defaultValue,
                validate: (input: Choice) => {
                    if (!options?.validator)
                        return true;

                    return options.validator(input.value) || 'Invalid value, try again.';
                },
            },
        ]);

        return input;
    }
}