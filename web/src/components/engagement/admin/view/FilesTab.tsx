import React, { Suspense } from 'react';
import {
    faChevronDown,
    faEye,
    faDownload,
    faCopy,
    faEdit,
    faLinkSlash,
    faTrash,
    faFileDownload,
} from '@fortawesome/pro-regular-svg-icons';
import {
    Grid2 as Grid,
    Menu,
    MenuItem,
    ListItemIcon,
    Checkbox,
    TableSortLabel,
    Tooltip,
    LinearProgress,
    CircularProgress,
    Divider,
} from '@mui/material';
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
import { getFileIcon } from 'helper/getFileIcon';
import { Await, useRouteLoaderData } from 'react-router';
import { EngagementLoaderAdminData } from '../EngagementLoaderAdmin';
import { FilesLightbox, canBePreviewed } from './FilesLightbox';
import { UploadedFile } from 'models/uploadedFile';
import { EngagementFile } from 'models/engagementFile';
import { downloadObject } from 'services/objectStorageService';
import { WidgetLocation } from 'models/widget';

const tableHeadCells: HeadCell<EngagementFile>[] = [
    { key: 'uploaded_file', nestedSortKey: 'uploaded_file.filename', label: 'Name', allowSort: true },
    { key: 'uploaded_file', nestedSortKey: 'uploaded_file.size', label: 'Size', allowSort: true },
    { key: 'location', label: 'Location', numeric: false, disablePadding: false, allowSort: true },
    { key: 'uploaded_file', nestedSortKey: 'uploaded_file.mimetype', label: 'File Type', allowSort: true },
];

const FilesTab = () => {
    const [selectedItems, setSelectedItems] = React.useState<readonly string[]>([]);
    const [order, setOrder] = React.useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = React.useState<string>('uploaded_file.filename');
    const [downloadQueue, setDownloadQueue] = React.useState<number>(0);
    const [previewingFiles, setPreviewingFiles] = React.useState<UploadedFile[]>([]);
    const loaderData = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;

    const [menuTarget, setMenuTarget] = React.useState<HTMLElement | null>(null);
    const [menuTargetId, setMenuTargetId] = React.useState<string | null>(null);

    const handleRequestSort = (event: React.MouseEvent<unknown>, property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleClose = () => {
        setMenuTarget(null);
        setMenuTargetId(null);
    };

    const handlePreview = async (files: EngagementFile[]) => {
        setPreviewingFiles(files.map((file) => file.uploaded_file));
        handleClose();
    };

    const handleDownload = async (files: EngagementFile[]) => {
        setDownloadQueue((prev) => prev + files.length);
        const start = Date.now();
        console.log('Beginning download!');
        try {
            const promises = files
                // Start downloading the largest files first
                .toSorted((a, b) => b.uploaded_file.size - a.uploaded_file.size)
                .map(async (file) => {
                    const result = await downloadObject({
                        filename: file.uploaded_file.filename,
                        s3sourceuri: file.uploaded_file.url,
                    });
                    setDownloadQueue((prev) => prev - 1);
                    return result;
                });
            await Promise.all(promises);
        } finally {
            const end = Date.now();
            console.log(`Download finished in ${(end - start) / 1000} s`);
            setDownloadQueue(0);
            handleClose();
        }
    };

    const handleCopyLink = async (files: EngagementFile[]) => {
        const currentFile = files[0];
        if (currentFile) {
            await navigator.clipboard.writeText(currentFile.uploaded_file.url);
        }
        handleClose();
    };

    const handleSingleAction = (action: (files: EngagementFile[]) => void) => {
        // Return a callback that will preview the currently selected file and close the menu
        return async () => {
            const files = await loaderData.files;
            const currentFile = files.find((file) => file.id.toString() === menuTargetId?.toString());
            if (currentFile) {
                action([currentFile]);
            }
            handleClose();
        };
    };

    const handleBulkAction = (action: (files: EngagementFile[]) => void) => {
        return async () => {
            const files = await loaderData.files;
            const currentFiles = files.filter((file) => selectedItems.includes(file.id.toString()));
            if (currentFiles.length > 0) {
                action(currentFiles);
            }
            handleClose();
        };
    };

    type propertyKey = {
        [x: string]: keyof propertyKey;
    };

    const getPropertyByNestedKey = (obj: propertyKey, key: string) => {
        return key.split('.').reduce((acc: propertyKey, part: string) => acc?.[part], obj);
    };

    const unlinkedFiles = (files: EngagementFile[]) => {
        return files.filter((file) => !file.location);
    };

    const sortByFileSize = (a: EngagementFile, b: EngagementFile, asc?: boolean) => {
        return asc ? a.uploaded_file.size - b.uploaded_file.size : b.uploaded_file.size - a.uploaded_file.size;
    };

    const sortByLocation = (a: EngagementFile, b: EngagementFile, asc?: boolean) => {
        const [first, second] = asc ? [a, b] : [b, a];
        const firstLocation = (first.location ?? '') + (first.widget_id ? first.widget!.location.toString() : '');
        const secondLocation = (second.location ?? '') + (second.widget_id ? second.widget!.location.toString() : '');
        if (!first.location && second.location) {
            return 1;
        }
        if (!second.location && first.location) {
            return -1;
        }
        return firstLocation.localeCompare(secondLocation) * (asc ? 1 : -1);
    };

    return (
        <Grid container direction="column" gap={1} width="100%">
            <Grid container size={12}>
                <Grid container size="auto">
                    <Heading2 mb={0} decorated>
                        Files
                    </Heading2>
                </Grid>
            </Grid>
            <Grid>
                <Grid container gap={1}>
                    <Grid
                        height="40px"
                        display={selectedItems.length < 1 ? 'flex' : 'none'}
                        gap={2}
                        alignItems="center"
                    >
                        <Suspense>
                            <Await resolve={loaderData.files}>
                                {(files) => (
                                    <BodyText display="inline-flex" gap={2} component="div">
                                        <span>
                                            <b>{files.length}</b> file{files.length !== 1 ? 's' : ''}
                                        </span>
                                        <Divider orientation="vertical" flexItem />
                                        <span>
                                            <b>{unlinkedFiles(files).length}</b> unlinked
                                        </span>
                                    </BodyText>
                                )}
                            </Await>
                        </Suspense>
                    </Grid>
                    <Grid display={selectedItems.length < 1 ? 'none' : 'flex'} gap={2} alignItems="center">
                        <BodyText bold>
                            {selectedItems.length} file{selectedItems.length !== 1 ? 's' : ''} selected
                        </BodyText>
                        <Divider orientation="vertical" flexItem />
                        <Button
                            size="small"
                            icon={<FontAwesomeIcon icon={faEye} />}
                            onClick={handleBulkAction(handlePreview)}
                        >
                            Preview
                        </Button>
                        <Button
                            disabled={downloadQueue > 0}
                            size="small"
                            icon={
                                downloadQueue > 0 ? (
                                    <CircularProgress size="20px" />
                                ) : (
                                    <FontAwesomeIcon icon={faFileDownload} />
                                )
                            }
                            onClick={handleBulkAction(handleDownload)}
                        >
                            {downloadQueue > 0 ? `Downloading (${downloadQueue} files)` : 'Download'}
                        </Button>
                        <Button disabled size="small" color="error" icon={<FontAwesomeIcon icon={faTrash} />}>
                            Delete
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
            <TableContainer sx={{ maxWidth: 'Layout.width.default', width: '100%', overflowX: 'auto' }}>
                <Table aria-labelledby="tableTitle" size="medium">
                    <TableHead>
                        <TableHeadRow>
                            <TableHeadCell padding="checkbox">
                                <Suspense fallback={<Checkbox />}>
                                    <Await resolve={loaderData.files}>
                                        {(fileRows) => (
                                            <Checkbox
                                                indeterminate={
                                                    selectedItems.length > 0 && selectedItems.length < fileRows.length
                                                }
                                                checked={
                                                    fileRows.length > 0 && selectedItems.length === fileRows.length
                                                }
                                                onChange={(event) => {
                                                    if (selectedItems.length === 0) {
                                                        setSelectedItems(fileRows.map((row) => row.id.toString()));
                                                    } else {
                                                        setSelectedItems([]);
                                                    }
                                                }}
                                            />
                                        )}
                                    </Await>
                                </Suspense>
                            </TableHeadCell>
                            {tableHeadCells.map((headCell) => (
                                <TableHeadCell
                                    key={headCell.nestedSortKey || headCell.key}
                                    align={headCell.numeric ? 'right' : 'left'}
                                    padding={headCell.disablePadding ? 'none' : 'normal'}
                                    sortDirection={
                                        [headCell.nestedSortKey, headCell.key].includes(orderBy) ? order : false
                                    }
                                >
                                    <TableSortLabel
                                        active={[headCell.nestedSortKey, headCell.key].includes(orderBy)}
                                        direction={orderBy === (headCell.nestedSortKey ?? headCell.key) ? order : 'asc'}
                                        onClick={(event) =>
                                            handleRequestSort(event, headCell.nestedSortKey ?? headCell.key)
                                        }
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
                        <Suspense
                            fallback={
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ p: 0 }}>
                                        <LinearProgress />
                                    </TableCell>
                                </TableRow>
                            }
                        >
                            <Await resolve={loaderData.files}>
                                {(fileRows) => {
                                    const currentMenuTarget = fileRows.find(
                                        (row) => row.id.toString() === menuTargetId,
                                    );
                                    const isUnlinked = currentMenuTarget?.location === 'other';
                                    const sortedRows = fileRows.toSorted((a, b) => {
                                        console.log('orderBy', orderBy);
                                        if (orderBy === 'uploaded_file.size') {
                                            return sortByFileSize(a, b, order == 'asc');
                                        } else if (orderBy === 'location') {
                                            return sortByLocation(a, b, order == 'asc');
                                        } else {
                                            const aValue = getPropertyByNestedKey(a, orderBy)?.toString() ?? '';
                                            const bValue = getPropertyByNestedKey(b, orderBy)?.toString() ?? '';
                                            return order === 'asc'
                                                ? aValue.toLowerCase().localeCompare(bValue.toLowerCase())
                                                : bValue.toLowerCase().localeCompare(aValue.toLowerCase());
                                        }
                                    });
                                    return sortedRows
                                        .map((row) => {
                                            if (!row?.id) return null;
                                            const handleSelect = () => {
                                                const selectedIndex = selectedItems.indexOf(row.id.toString());
                                                let newSelected: readonly string[] = [];
                                                if (selectedIndex === -1) {
                                                    newSelected = newSelected.concat(selectedItems, row.id.toString());
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
                                                <TableRow key={row.id.toString()} onClick={handleSelect}>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            checked={selectedItems.includes(row.id.toString())}
                                                            onChange={handleSelect}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="left">
                                                        {
                                                            <FontAwesomeIcon
                                                                icon={getFileIcon(
                                                                    row.uploaded_file.unique_filename,
                                                                    true,
                                                                )}
                                                                style={{ marginInlineEnd: '0.5em' }}
                                                                height="16px"
                                                                width="16px"
                                                            />
                                                        }
                                                        {row.uploaded_file.filename}
                                                    </TableCell>
                                                    <TableCell align="left">
                                                        {bytesToSize(row.uploaded_file.size, 1)}
                                                    </TableCell>
                                                    <TableCell align="left">
                                                        {((row) => {
                                                            if (row.location === 'banner') return 'Hero Banner';
                                                            if (row.location === 'widget' && row.widget) {
                                                                if (!row.widget.location)
                                                                    return (
                                                                        <BodyText color="textSecondary">
                                                                            Orphaned Widget: {row.widget.title}
                                                                        </BodyText>
                                                                    );
                                                                const location = WidgetLocation[row.widget.location];
                                                                return (
                                                                    <>
                                                                        <BodyText>{location}</BodyText>
                                                                        <BodyText color="textSecondary">
                                                                            Widget: {row.widget.title}
                                                                        </BodyText>
                                                                    </>
                                                                );
                                                            }
                                                            return (
                                                                <BodyText color="textSecondary">
                                                                    &ndash;&ndash;
                                                                </BodyText>
                                                            );
                                                        })(row)}
                                                    </TableCell>
                                                    <TableCell align="left">{row.uploaded_file.mimetype}</TableCell>
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
                                                                event.stopPropagation();
                                                                setMenuTarget(event.currentTarget);
                                                                setMenuTargetId(row.id.toString());
                                                            }}
                                                        >
                                                            Select Action
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                        .concat(
                                            <Menu
                                                open={!!menuTarget}
                                                anchorEl={menuTarget}
                                                onClose={handleClose}
                                                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                                                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                                            >
                                                <MenuItem
                                                    onClick={handleSingleAction(handlePreview)}
                                                    disabled={!canBePreviewed(currentMenuTarget?.uploaded_file)}
                                                >
                                                    <ListItemIcon>
                                                        <FontAwesomeIcon icon={faEye} />
                                                    </ListItemIcon>
                                                    Preview
                                                </MenuItem>
                                                <MenuItem onClick={handleSingleAction(handleDownload)}>
                                                    <ListItemIcon>
                                                        <FontAwesomeIcon icon={faDownload} />
                                                    </ListItemIcon>
                                                    Download
                                                </MenuItem>
                                                <MenuItem onClick={handleSingleAction(handleCopyLink)}>
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
                                                <MenuItem onClick={handleClose} disabled={isUnlinked}>
                                                    <ListItemIcon>
                                                        <FontAwesomeIcon icon={faLinkSlash} />
                                                    </ListItemIcon>
                                                    Unlink
                                                </MenuItem>
                                                <Tooltip
                                                    arrow
                                                    slotProps={{
                                                        popper: { placement: 'left' },
                                                    }}
                                                    title={isUnlinked ? 'Must unlink before deleting' : ''}
                                                >
                                                    {/* Wrap the MenuItem in a span to allow Tooltip to work correctly */}
                                                    <span>
                                                        <MenuItem onClick={handleClose} disabled={!isUnlinked}>
                                                            <ListItemIcon sx={{ color: 'error.main' }}>
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </ListItemIcon>
                                                            <BodyText color="error.dark">Delete</BodyText>
                                                        </MenuItem>
                                                    </span>
                                                </Tooltip>
                                            </Menu>,
                                        );
                                }}
                            </Await>
                        </Suspense>
                    </TableBody>
                </Table>
            </TableContainer>
            <FilesLightbox
                open={!!previewingFiles.length}
                onClose={() => setPreviewingFiles([])}
                files={previewingFiles}
            />
        </Grid>
    );
};

export default FilesTab;
