import { AxiosResponse } from 'axios';

export function hasKey<O>(obj: O, key: PropertyKey): key is keyof O {
    if (typeof obj !== 'object' || !obj) {
        return false;
    }
    return key in obj;
}

export function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return String(error);
}

export function checkEmail(email: string) {
    const filter = /^([a-zA-Z0-9_.-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return filter.test(email);
}

export const downloadFile = (response: AxiosResponse<Blob, unknown>, filename: string) => {
    if (!filename) {
        throw new Error('Filename must be specified');
    }

    const url = globalThis.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
};

export const reorder = <T>(list: T[], startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

export const blobToFile = (theBlob: Blob, fileName: string): File => {
    const file: Blob & { lastModifiedDate?: Date; name?: string } = theBlob;
    //A Blob() is almost a File() - it's just missing the two properties below which we will add
    file.lastModifiedDate = new Date();
    file.name = fileName;

    //Cast to a File() type
    return <File>theBlob;
};

export const determinePathSegments = () => {
    const url = new URL(globalThis.location.href);
    // filters out empty segments, which can occur if there are leading or trailing slashes in the pathname
    const pathSegments = url.pathname.split('/').filter((segment) => segment.trim() !== '');
    return pathSegments;
};

export const findTenantInPath = () => {
    // finding tenant from the path segments
    const pathSegments = determinePathSegments();
    return pathSegments.length > 0 ? pathSegments[0].toLowerCase() : '';
};

// Convert hex color to RGB
export const hexToRgb = (hex: string) => {
    hex = hex.replace('#', '');
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
};

// Whether a color is dark (i.e. needs an inverted text style) or not
export const isDarkColor = (color: string, sensitivity = 0.5) => {
    // Ensure sensitivity is between 0 and 1
    sensitivity = Math.max(0, Math.min(1, sensitivity));
    // Convert the color to RGB
    const [r, g, b] = hexToRgb(color);
    // Calculate the perceived luminance of the color
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < sensitivity;
};

export type Awaited<T> = {
    [K in keyof T]: T[K] extends Promise<infer U> ? U : T[K];
};
