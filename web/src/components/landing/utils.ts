import { tryParse } from 'helper';
import { SearchFilters } from './types';

export const updateSearchParams = (newFilters: SearchFilters, searchParams: URLSearchParams) => {
    const newParams = Object.fromEntries(Object.entries(newFilters).map(([k, v]) => [k, convertToString(v) as string]));
    const existingParams = Object.fromEntries(searchParams.entries());
    const joinedParams = Object.entries({ ...existingParams, ...newParams });
    const filtered = joinedParams.filter(([_, value]) => {
        // Remove blank values to keep our URL tidy
        return !(value == null || value === '' || value === '[]' || (Array.isArray(value) && value.length === 0));
    });
    return new URLSearchParams(filtered);
};

const convertToString = (data: string | number | object) => {
    if (typeof data === 'number') {
        return String(data); // number
    } else if (typeof data === 'object') {
        return JSON.stringify(data); // object or array
    } else {
        return data; // string
    }
};

export const getSearchParamObject = (property: string, searchParams: URLSearchParams) => {
    const params = searchParams.get(property) || '';
    return tryParse(params) ? JSON.parse(params) : [];
};
