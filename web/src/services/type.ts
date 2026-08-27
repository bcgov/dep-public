export interface Page<T> {
    items: T[];
    total: number;
}

export type RequestHeaders = Record<string, string>;
