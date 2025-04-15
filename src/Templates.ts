import path from "path";
import fs from "fs";

import Handlebars from 'handlebars';

import * as Utils from '@/src/helpers/utils.js';

//

export default class Templates {
    private static readonly DIRECTORY = path.resolve(Utils.getProjectRoot(), `./assets/templates`);
    private static readonly SUFFIX = ".prompt.hbs";

    static List: string[];
    static Default: string = "eng";

    //

    static {
        this.List = (() => {
            const files = fs.readdirSync(this.DIRECTORY);
            return files
                .filter(f => f.endsWith(this.SUFFIX))
                .map(f => f.split('.')[0]); // eng.prompt.hbs → eng
        })();

        //

        if (!this.BuiltinExists(this.Default))
            throw new Error(`Default template '${this.Default}' doesn't exist.`);
    }

    //

    private static BuiltinExists(name: string) {
        return this.List.includes(name);
    }

    //

    static Load(template: string): string;
    static Load(template: string, compile: false): string;
    static Load(template: string, compile: true): HandlebarsTemplateDelegate<any>;
    static Load(template: string, compile?: boolean): HandlebarsTemplateDelegate<any> | string {
        const existsInBuiltIn = this.BuiltinExists(template);

        const templatePath = (() => {
            if (existsInBuiltIn)
                return path.resolve(this.DIRECTORY, `${template}${this.SUFFIX}`);

            return path.resolve(process.cwd(), template);
        })();

        //

        try {
            const content = fs.readFileSync(templatePath, 'utf-8');
            return compile ? Handlebars.compile(content) : content;
        }
        catch (err) {
            if (existsInBuiltIn)
                throw err;

            throw new Error(
                `Template "${template}" does not exist as a built-in template or as a local file at "${templatePath}". Ensure the file exists and is readable.`
            );
        }
    }
}