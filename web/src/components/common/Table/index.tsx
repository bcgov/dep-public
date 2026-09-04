import React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import { visuallyHidden } from '@mui/utils';
import { HeadCell, PageInfo, PaginationOptions } from 'components/common/Table/types';
import { LinearProgress } from '@mui/material';
import { Unless, When } from 'react-if';

type Order = 'asc' | 'desc';

interface CustomTableHeadProps<T> {
    onRequestSort: (event: React.MouseEvent<unknown>, property: keyof T, headCellIndex: number) => void;
    order?: Order;
    orderBy?: keyof T;
    nestedSortKey?: string | null;
    rowCount: number;
    headCells: HeadCell<T>[];
    loading: boolean;
}

/**
 * CustomTableHead is a component that renders the header of a table with sortable columns.
 * It uses Material-UI's TableHead, TableRow, TableCell, and TableSortLabel components.
 * It allows for sorting by clicking on the column headers, and displays the current sort order.
 * @param {CustomTableHeadProps<T>} props - The properties for the table head.
 * @param {Order} [props.order] - The current sort order, either 'asc' or 'desc'.
 * @param {keyof T} [props.orderBy] - The key of the column that is currently sorted.
 * @param {function} props.onRequestSort - The function to call when a column header is clicked for sorting.
 * @param {HeadCell<T>[]} props.headCells - An array of head cells that define the columns of the table.
 * @param {boolean} props.loading - Indicates whether the table is currently loading data.
 * @param {string | null} [props.nestedSortKey] - The nested sort key for sorting within a column.
 * @returns {JSX.Element} A Material-UI TableHead component with sortable column headers.
 */
function CustomTableHead<T>({
    order,
    orderBy,
    onRequestSort,
    headCells,
    loading,
    nestedSortKey,
}: Readonly<CustomTableHeadProps<T>>) {
    const createSortHandler = (property: keyof T, headCellIndex: number) => (event: React.MouseEvent<unknown>) => {
        onRequestSort(event, property, headCellIndex);
    };

    return (
        <TableHead>
            <TableRow>
                {headCells.map((headCell, index) => (
                    <TableCell
                        key={`${String(headCell.key)}${index}`}
                        align={headCell.align}
                        style={headCell.customStyle || {}}
                        sortDirection={orderBy === headCell.key ? order : false}
                        sx={{ borderBottom: '1.5px solid gray', fontWeight: 'bold' }}
                    >
                        <TableSortLabel
                            disabled={!headCell.allowSort || loading}
                            active={orderBy === headCell.key && nestedSortKey === headCell.nestedSortKey}
                            direction={
                                orderBy === headCell.key && nestedSortKey === headCell.nestedSortKey ? order : 'asc'
                            }
                            onClick={createSortHandler(headCell.key, index)}
                            hideSortIcon={Boolean(headCell.hideSorticon)}
                        >
                            {headCell.label}
                            {headCell.icon}
                            {orderBy === headCell.key && nestedSortKey === headCell.nestedSortKey && (
                                <Box component="span" sx={visuallyHidden}>
                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                </Box>
                            )}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}

export interface CustomTableProps<T> {
    headCells: HeadCell<T>[];
    rows: T[];
    hideHeader?: boolean;
    noRowBorder?: boolean;
    handleChangePagination?: (pagination: PaginationOptions<T>) => void;
    loading?: boolean;
    paginationOptions?: PaginationOptions<T>;
    pageInfo?: PageInfo;
    noPagination?: boolean;
    emptyText?: string;
    commentTable?: boolean;
}
/**
 * CustomTable is a generic table component that displays data in a tabular format.
 * It supports sorting, pagination, and customizable headers.
 * The table can be configured to hide the header, disable row borders, and handle pagination changes.
 * @param {CustomTableProps<T>} props - The properties for the table.
 * @param {HeadCell<T>[]} props.headCells - An array of head cells that define the columns of the table.
 * @param {T[]} props.rows - An array of data rows to be displayed in the table.
 * @param {boolean} [props.hideHeader=false] - If true, the table header will not be displayed.
 * @param {boolean} [props.noRowBorder=false] - If true, the table rows will not have borders.
 * @param {function} [props.handleChangePagination] - A function to handle pagination changes.
 * @param {boolean} [props.loading=false] - If true, the table will show a loading indicator.
 * @param {PaginationOptions<T>} [props.paginationOptions] - Options for pagination, including page number, size, sort key, and sort order.
 * @param {PageInfo} [props.pageInfo] - Information about the current page, including total records.
 * @param {boolean} [props.noPagination=false] - If true, pagination controls will not be displayed.
 * @param {string} [props.emptyText='No records were found'] - Text to display when there are no records in the table.
 * @param {boolean} [props.commentTable=false] - If true, the table is styled for comments, typically with no padding in cells.
 * @returns {JSX.Element} A Material-UI Paper component containing the table with the specified properties.
 */
function CustomTable<T>({
    hideHeader = false,
    headCells = [],
    rows = [],
    noRowBorder = false,
    noPagination = false,
    commentTable = false,

    handleChangePagination = (_pagination: PaginationOptions<T>) => {},
    loading = false,
    paginationOptions = {
        page: 1,
        size: rows.length,
    },
    pageInfo = {
        total: rows.length,
    },
    emptyText = 'No records were found',
}: Readonly<CustomTableProps<T>>) {
    const { page = 1, size, sort_key, sort_order, nested_sort_key } = paginationOptions;
    const { total } = pageInfo;

    const order = sort_order;
    const orderBy = sort_key;

    const rowsPerPage = size && size > 0 ? size : 5;
    const baseRowsPerPageOptions = [5, 10, 25];
    const rowsPerPageOptions = baseRowsPerPageOptions.includes(rowsPerPage)
        ? baseRowsPerPageOptions
        : [...baseRowsPerPageOptions, rowsPerPage].sort((a, b) => a - b);

    const handleRequestSort = (_event: React.MouseEvent<unknown>, property: keyof T, headCellIndex: number) => {
        const isAsc = orderBy === property && order === 'asc';
        handleChangePagination({
            ...paginationOptions,
            sort_key: property,
            nested_sort_key: headCells[headCellIndex].nestedSortKey,
            sort_order: isAsc ? 'desc' : 'asc',
        });
    };

    const handleChangePage = (_event: unknown, newPage: number) => {
        handleChangePagination({
            ...paginationOptions,
            page: newPage + 1,
        });
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newSize = parseInt(event.target.value, 10);
        handleChangePagination({
            ...paginationOptions,
            page: 1,
            size: newSize,
        });
    };

    // Avoid a layout jump when reaching the last page with empty filteredRows.
    const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - total) : 0;

    return (
        <Box data-testid="listing-table">
            <Paper sx={{ width: '100%', mb: 2 }} elevation={0}>
                <TableContainer>
                    <Table aria-labelledby="Engagements">
                        <When condition={!hideHeader}>
                            <CustomTableHead
                                order={order}
                                orderBy={orderBy}
                                nestedSortKey={nested_sort_key}
                                onRequestSort={handleRequestSort}
                                rowCount={rows.length}
                                headCells={headCells}
                                loading={loading}
                            />
                        </When>

                        <TableBody>
                            <TableRow
                                sx={{
                                    height: 5,
                                }}
                            >
                                <TableCell
                                    sx={{ padding: 0, border: 'none', verticalAlign: 'top' }}
                                    colSpan={headCells.length}
                                >
                                    <When condition={loading}>
                                        <LinearProgress />
                                    </When>
                                </TableCell>
                            </TableRow>

                            {rows.map((row, rowIndex) => {
                                return (
                                    <TableRow hover tabIndex={-1} key={`row-${rowIndex}`}>
                                        {headCells.map((cell, cellIndex) => (
                                            <TableCell
                                                align={cell.align}
                                                key={`row-${rowIndex}-${cellIndex}`}
                                                style={cell.customStyle || {}}
                                                sx={{
                                                    paddingTop: commentTable ? 0 : '16px',
                                                    border: noRowBorder ? 'none' : '',
                                                }}
                                            >
                                                {cell.renderCell ? cell.renderCell(row) : String(row[cell.key])}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })}
                            {rows.length == 0 && (
                                <TableRow>
                                    <TableCell colSpan={headCells.length} align={'center'}>
                                        <When condition={loading}>Loading Records</When>
                                        <When condition={!loading}>{emptyText}</When>
                                    </TableCell>
                                </TableRow>
                            )}
                            {emptyRows > 0 && (
                                <TableRow
                                    style={{
                                        height: 53 * emptyRows,
                                    }}
                                >
                                    <TableCell
                                        colSpan={headCells.length}
                                        sx={{
                                            border: noRowBorder ? 'none' : '',
                                        }}
                                    />
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Unless condition={noPagination}>
                    <TablePagination
                        data-testid="Table-Pagination"
                        rowsPerPageOptions={rowsPerPageOptions}
                        component="div"
                        count={total}
                        rowsPerPage={rowsPerPage}
                        page={page - 1}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Unless>
            </Paper>
        </Box>
    );
}

export default CustomTable;
