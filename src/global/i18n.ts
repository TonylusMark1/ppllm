export interface Translation {
    promptPlaceholder: string;
    fileStructure: string;
    fileContents: string;
    file: string;
    name: string;
    error: string;
    largeFile: string;
    binaryFile: string;
    innerPromptsHeader: string;
    innerPromptRules: string;

    readError: (filepath: string) => string;
    dirconfigReadingError: (filepath: string) => string;
    promptSuccessFile: (filepath: string) => string;
    invalidMaxSize: (value: string | number) => string;
}

//

export const i18n: Record<string, Translation> = {
    pl: {
        promptPlaceholder: '[Tutaj wpisz swój prompt]',
        fileStructure: '=== Struktura plików projektu ===',
        fileContents: '=== Zawartość plików ===',
        file: 'Plik',
        name: 'Nazwa',
        error: 'Błąd:',
        largeFile: 'Plik jest zbyt duży i nie został wczytany',
        binaryFile: 'Plik jest binarny i nie został wczytany',
        innerPromptsHeader: '=== Wewnętrzne zasady ===',
        innerPromptRules: 'zasady obowiązujace wewnątrz tego folderu',

        readError: filepath => `Błąd odczytu pliku: ${filepath}`,
        dirconfigReadingError: filepath => `Nie udało się sprasować pliku dirconfig w lokalizacji: ${filepath}`,
        promptSuccessFile: filepath => `Prompt został wygenerowany i zapisany do pliku: ${filepath}`,
        invalidMaxSize: value => `Błędna wartość limitu rozmiaru: ${value}`,
    },
    eng: {
        promptPlaceholder: '[Enter your prompt here]',
        fileStructure: '=== Project File Structure ===',
        fileContents: '=== File Contents ===',
        file: 'File',
        name: 'Name',
        error: 'Error:',
        largeFile: 'File is too large and was not loaded',
        binaryFile: 'File is binary and was not loaded',
        innerPromptsHeader: '=== Inner Rules ===',
        innerPromptRules: 'rules inside this folder',
        

        readError: filepath => `File read error: ${filepath}`,
        dirconfigReadingError: filepath => `Failed to parse the dirconfig file at location: ${filepath}`,
        promptSuccessFile: filepath => `Prompt generated and saved to file: ${filepath}`,
        invalidMaxSize: value => `Invalid max size value: ${value}`,
    },
};