import { AppConfig } from 'config';

export const replaceUrl = (URL: string, key: string, value: string) => {
    return URL.replace(key, value);
};

interface Params {
    [param: string]: string;
}
export const replaceAllInURL = ({ URL, params }: { URL: string; params: Params }) => {
    const regex = new RegExp(Object.keys(params).join('|'), 'gi');

    return URL.replace(regex, function (matched) {
        return params[matched];
    });
};

/*
 * Constructs the full base URL for the application, taking into account the public URL and any basename specified in session storage.
 * This can be combined with the getPath function to generate complete URLs for shared links or other scenarios where the full URL is needed.
 * This is useful for ensuring that all API requests and links are correctly prefixed with the appropriate base URL, especially in cases where the application is deployed under a subpath.
 */
export const getBaseUrl = () => {
    const basename = sessionStorage.getItem('basename');
    const domain = AppConfig.publicUrl ? AppConfig.publicUrl : window.location.origin;
    const baseUrl = basename ? `${domain}/${basename}` : domain;
    return baseUrl;
};

export const filterQueryParams = (queryParams: { [x: string]: unknown }) => {
    const filteredQueryParams: { [x: string]: unknown } = {};
    Object.keys(queryParams).forEach((key) => {
        if (queryParams[key]) {
            filteredQueryParams[key] = queryParams[key];
        }
    });
    return filteredQueryParams;
};

// used to measure the distance (similarity/difference) between two strings
export const levenshteinDistance = (string1: string, string2: string): number => {
    if (string1.length < string2.length) {
        return levenshteinDistance(string2, string1);
    }
    if (string2.length === 0) {
        return string1.length;
    }
    const previousRow = Array.from({ length: string2.length + 1 }, (_, i) => i);
    for (let i = 0; i < string1.length; i++) {
        const currentRow = [i + 1];
        for (let j = 0; j < string2.length; j++) {
            const insertions = previousRow[j + 1] + 1;
            const deletions = currentRow[j] + 1;
            const substitutions = previousRow[j] + (string1[i] !== string2[j] ? 1 : 0);
            currentRow.push(Math.min(insertions, deletions, substitutions));
        }
        previousRow.splice(0, previousRow.length, ...currentRow);
    }
    return previousRow[string2.length];
};
