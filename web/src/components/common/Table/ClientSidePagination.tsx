import React, { useEffect } from 'react';
import { CustomTableProps } from '.';
import { PaginationOptions } from './types';

interface ClientSidePaginationProps<T> {
    rows: T[];
    searchFilter?: {
        key: keyof T;
        value: string;
    };
    children: (props: CustomTableProps<T>) => React.ReactElement<CustomTableProps<T>>;
}

export function ClientSidePagination<T>({ rows, searchFilter, children }: Readonly<ClientSidePaginationProps<T>>) {
    const [paginationOptions, setPaginationOptions] = React.useState<PaginationOptions<T>>({
        page: 1,
        size: 10, // default page size
    });
    const [pageInfo, setPageInfo] = React.useState({ total: rows.length });
    const [searchFilteredRows, setSearchFilteredRows] = React.useState<T[]>([]);
    const [paginatedRows, setPaginatedRows] = React.useState<T[]>([]);

    const handleChangePagination = (newPaginationOptions: PaginationOptions<T>) => {
        const { page, size } = newPaginationOptions;
        const paginated = searchFilteredRows.slice((page - 1) * size, page * size);
        setPaginationOptions(newPaginationOptions);
        setPageInfo({ total: rows.length });
        setPaginatedRows(paginated);
    };

    const handleFilter = () => {
        if (!searchFilter?.value) {
            setSearchFilteredRows(rows);
            setPageInfo({ total: rows.length });
            setPaginationOptions({ ...paginationOptions, page: 1 });
            return;
        }
        const filtered = rows.filter((row) =>
            String(row[searchFilter.key]).toLowerCase().includes(searchFilter.value.toLowerCase()),
        );
        const newTotal = filtered.length;
        setSearchFilteredRows(filtered);
        setPageInfo({ total: newTotal });
        setPaginationOptions({ ...paginationOptions, page: 1 });
    };

    useEffect(() => {
        handleFilter();
    }, [searchFilter, rows]);

    useEffect(() => {
        handleChangePagination(paginationOptions);
    }, [searchFilteredRows]);

    const customTableComponent = children({
        rows: paginatedRows, // Use the filtered rows for rendering
        loading: false,
        handleChangePagination,
        paginationOptions,
        pageInfo,
        headCells: [],
    });

    return <>{customTableComponent}</>;
}
