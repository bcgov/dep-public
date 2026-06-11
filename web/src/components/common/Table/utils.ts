import { PaginationOptions } from './types';

export function updateURLWithPagination<T>(paginationOptions: PaginationOptions<T>) {
    const url = new URL(globalThis.location.href);
    url.searchParams.set('page', paginationOptions.page.toString());
    url.searchParams.set('size', paginationOptions.size.toString());
    globalThis.history.replaceState({}, '', url.toString());
}
