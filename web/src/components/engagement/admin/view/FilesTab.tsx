import React from 'react';
import {
    faChevronDown,
    faEye,
    faDownload,
    faCopy,
    faEdit,
    faLinkSlash,
    faTrash,
    faUpload,
} from '@fortawesome/pro-regular-svg-icons';
import { Grid2 as Grid, Menu, MenuItem, ListItemIcon, Checkbox, TableSortLabel } from '@mui/material';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableHeadCell,
    TableHeadRow,
} from 'components/common/Layout';
import { HeadCell } from 'components/common/Table/types';
import { Button } from 'components/common/Input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { bytesToSize } from 'helper';
import { BodyText, Heading2 } from 'components/common/Typography';
import { getFileIcon } from 'engagements/widgets/DocumentWidget';

interface FileRow {
    id: string;
    name: string;
    size: number;
    location?: string;
    fileType: string;
}

const tableHeadCells: HeadCell<FileRow>[] = [
    { key: 'name', label: 'Name', numeric: false, disablePadding: false, allowSort: true },
    { key: 'size', label: 'Size', numeric: false, disablePadding: false, allowSort: true },
    { key: 'location', label: 'Location', numeric: false, disablePadding: false, allowSort: true },
    { key: 'fileType', label: 'File Type', numeric: false, disablePadding: false, allowSort: true },
];

const sampleFileRows = [
    { id: 'sample-file', name: 'Sample File', size: 1400000, location: 'Hero Banner', fileType: 'text/plain' },
    { id: 'another-file', name: 'Another File', size: 952000, location: 'Widget: Files', fileType: 'application/pdf' },
    { id: 'image-file', name: 'Image File', size: 2048000, location: undefined, fileType: 'image/jpeg' },
];

const FilesTab = () => {
    const [selectedItems, setSelectedItems] = React.useState<readonly string[]>([]);
    const [order, setOrder] = React.useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = React.useState<keyof FileRow>('name');

    const [menuTarget, setMenuTarget] = React.useState<HTMLElement | null>(null);
    const [menuTargetId, setMenuTargetId] = React.useState<string | null>(null);

    const currentMenuTarget = sampleFileRows.find((row) => row.id === menuTargetId);

    const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof FileRow) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const fileRows = sampleFileRows.toSorted((a, b) => {
        if (orderBy === 'size') {
            return order === 'asc' ? a.size - b.size : b.size - a.size;
        } else {
            const aValue = (a[orderBy] as string) ?? '';
            const bValue = (b[orderBy] as string) ?? '';
            return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
    });

    const handleClose = () => {
        setMenuTarget(null);
        setMenuTargetId(null);
    };

    return (
        <Grid container direction="column" gap={2} width="100%">
            <Grid container size={12}>
                <Grid container size="auto">
                    <Heading2 decorated>Files</Heading2>
                </Grid>
                <Grid container size="grow" justifyContent="flex-end" pr={2}>
                    <Button icon={<FontAwesomeIcon icon={faUpload} />} variant="primary">
                        Upload File
                    </Button>
                </Grid>
            </Grid>
            <Menu
                open={!!menuTarget}
                anchorEl={menuTarget}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                        <FontAwesomeIcon icon={faEye} />
                    </ListItemIcon>
                    Preview
                </MenuItem>
                <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                        <FontAwesomeIcon icon={faDownload} />
                    </ListItemIcon>
                    Download
                </MenuItem>
                <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                        <FontAwesomeIcon icon={faCopy} />
                    </ListItemIcon>
                    Copy Link
                </MenuItem>
                <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                        <FontAwesomeIcon icon={faEdit} />
                    </ListItemIcon>
                    Rename
                </MenuItem>
                <MenuItem onClick={handleClose} disabled={currentMenuTarget?.location === undefined}>
                    <ListItemIcon>
                        <FontAwesomeIcon icon={faLinkSlash} />
                    </ListItemIcon>
                    Unlink
                </MenuItem>
                <MenuItem onClick={handleClose} disabled={currentMenuTarget?.location !== undefined}>
                    <ListItemIcon sx={{ color: 'error.main' }}>
                        <FontAwesomeIcon icon={faTrash} />
                    </ListItemIcon>
                    <BodyText color="error.dark">Delete</BodyText>
                </MenuItem>
            </Menu>
            <TableContainer sx={{ maxWidth: 'Layout.width.default', width: '100%', overflowX: 'auto' }}>
                <Table aria-labelledby="tableTitle" size="medium">
                    <TableHead>
                        <TableHeadRow>
                            <TableHeadCell padding="checkbox">
                                <Checkbox
                                    indeterminate={selectedItems.length > 0 && selectedItems.length < fileRows.length}
                                    checked={fileRows.length > 0 && selectedItems.length === fileRows.length}
                                    onChange={(event) => {
                                        if (event.target.checked) {
                                            setSelectedItems(fileRows.map((row) => row.id));
                                        } else {
                                            setSelectedItems([]);
                                        }
                                    }}
                                />
                            </TableHeadCell>
                            {tableHeadCells.map((headCell) => (
                                <TableHeadCell
                                    key={headCell.key}
                                    align={headCell.numeric ? 'right' : 'left'}
                                    padding={headCell.disablePadding ? 'none' : 'normal'}
                                    sortDirection={orderBy === headCell.key ? order : false}
                                >
                                    <TableSortLabel
                                        active={orderBy === headCell.key}
                                        direction={orderBy === headCell.key ? order : 'asc'}
                                        onClick={(event) => handleRequestSort(event, headCell.key)}
                                    >
                                        {headCell.label}
                                    </TableSortLabel>
                                </TableHeadCell>
                            ))}
                            <TableHeadCell sx={{ maxWidth: 170, width: 170, boxSizing: 'content-box' }} align="left">
                                Actions
                            </TableHeadCell>
                        </TableHeadRow>
                    </TableHead>
                    <TableBody>
                        {fileRows.map((row) => {
                            const handleSelect = () => {
                                const selectedIndex = selectedItems.indexOf(row.id);
                                let newSelected: readonly string[] = [];
                                if (selectedIndex === -1) {
                                    newSelected = newSelected.concat(selectedItems, row.id);
                                } else if (selectedIndex === 0) {
                                    newSelected = newSelected.concat(selectedItems.slice(1));
                                } else if (selectedIndex === selectedItems.length - 1) {
                                    newSelected = newSelected.concat(selectedItems.slice(0, -1));
                                } else if (selectedIndex > 0) {
                                    newSelected = newSelected.concat(
                                        selectedItems.slice(0, selectedIndex),
                                        selectedItems.slice(selectedIndex + 1),
                                    );
                                }
                                setSelectedItems(newSelected);
                            };
                            return (
                                <TableRow key={row.id} onClick={handleSelect}>
                                    <TableCell padding="checkbox">
                                        <Checkbox checked={selectedItems.includes(row.id)} onChange={handleSelect} />
                                    </TableCell>
                                    <TableCell align="left">
                                        {
                                            <FontAwesomeIcon
                                                icon={getFileIcon('.' + row.fileType.split('/').pop(), true)}
                                                style={{ marginInlineEnd: '0.5em' }}
                                                height="16px"
                                                width="16px"
                                            />
                                        }
                                        {row.name}
                                    </TableCell>
                                    <TableCell align="left">{bytesToSize(row.size, 1)}</TableCell>
                                    <TableCell align="left">
                                        {row.location || <BodyText color="text.secondary">Not linked</BodyText>}
                                    </TableCell>
                                    <TableCell align="left">{row.fileType}</TableCell>
                                    <TableCell
                                        sx={{ maxWidth: 170, width: 170, boxSizing: 'content-box' }}
                                        align="left"
                                    >
                                        <Button
                                            sx={{ minWidth: 'max-content' }}
                                            icon={<FontAwesomeIcon icon={faChevronDown} />}
                                            iconPosition="right"
                                            size="small"
                                            onClick={(event: React.MouseEvent<HTMLElement>) => {
                                                setMenuTarget(event.currentTarget);
                                                setMenuTargetId(row.id);
                                            }}
                                        >
                                            Select Action
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Grid>
    );
};

export default FilesTab;
