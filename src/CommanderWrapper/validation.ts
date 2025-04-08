import * as Types from "./types.js";

//

export function FindFirstInvalidRule<T>(validation: Types.ValidationRule<T>[]) {
    for (const rule of validation) {
        const isDirectValue = typeof rule === 'string' || typeof rule === 'number' || typeof rule === 'boolean';
        const isRegExp = rule instanceof RegExp;
        const isPatternObject =
            typeof rule === 'object' && rule !== null &&
            'pattern' in rule && rule.pattern instanceof RegExp &&
            'description' in rule && typeof rule.description === 'string';

        if (!isDirectValue && !isRegExp && !isPatternObject)
            return rule;
    }
}

export function IsValueValid<T>(value: T, validation?: Types.ValidationRule<T>[]): boolean {
        if (!validation || validation.length === 0)
            return true;

        //


        return validation.some(rule => {
            if (rule instanceof RegExp)
                return rule.test(String(value));
    
            if (typeof rule === 'object' && rule !== null && 'pattern' in rule)
                return rule.pattern.test(String(value));
    
            return rule === value;
        });
    }