export type ExtendEachParamWith<T, Extra> = {
    [K in keyof T]: T[K] | Extra;
};