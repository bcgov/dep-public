import {
    styled,
    Table as MuiTable,
    TableBody as MuiTableBody,
    TableCell as MuiTableCell,
    TableContainer as MuiTableContainer,
    TableHead as MuiTableHead,
    TableRow as MuiTableRow,
} from '@mui/material';
import { globalFocusVisible, colors } from '..';

export const Table = styled(MuiTable)({
    borderCollapse: 'collapse',
    width: '100%',
});

export const TableHead = styled(MuiTableHead)({});

export const TableHeadRow = styled(MuiTableRow)({
    backgroundColor: colors.surface.gray[10],
});

export const TableHeadCell = styled(MuiTableCell)({
    padding: '1rem 1rem 0.5rem 1rem',
    fontWeight: 700,
    color: colors.surface.gray[90],
    borderBottom: `1px solid ${colors.surface.gray[60]}`,
    maxWidth: '700px',
});

export const TableBody = styled(MuiTableBody)({});

export const TableRow = styled(MuiTableRow)(({ onClick }) => ({
    '&:hover': {
        backgroundColor: colors.surface.blue[10],
    },
    '&:active': {
        backgroundColor: colors.surface.blue[20],
    },
    cursor: onClick ? 'pointer' : 'default',

    ...globalFocusVisible,
}));
export const TableCell = styled(MuiTableCell)({
    padding: '1em',
    borderBottom: `1px solid ${colors.surface.gray[30]}`,
    maxWidth: '700px',
});

export const TableContainer = styled(MuiTableContainer)({});
