import { JSX } from 'react';

export interface HeadCell<T> {
    disablePadding?: boolean;
    key: keyof T;
    nestedSortKey?: string;
    label?: string;
    icon?: JSX.Element;
    hideSorticon?: boolean;
    numeric?: boolean;
    allowSort?: boolean;
    renderCell?: (row: T) => string | number | JSX.Element | null;
    customStyle?: React.CSSProperties;
    align?: 'right' | 'left' | 'inherit' | 'center' | 'justify';
}

export interface PaginationOptions<T> {
    page: number;
    size: number;
    sort_key?: keyof T;
    nested_sort_key?: string | null;
    sort_order?: 'asc' | 'desc';
}

export interface PageInfo {
    total: number;
}

export const createDefaultPageInfo = (): PageInfo => {
    return {
        total: 0,
    };
};
