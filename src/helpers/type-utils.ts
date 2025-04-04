export type ExtendWith<T, Extra> = {
    [K in keyof T]: T[K] | Extra;
};