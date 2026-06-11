import React, { Suspense, useMemo, useState } from 'react';
import { Grid2 as Grid, Skeleton, Paper, ThemeProvider } from '@mui/material';
import { Widget } from 'models/widget';
import { DocumentItem, DOCUMENT_TYPE } from 'models/document';
import { useLazyGetDocumentsQuery } from 'apiManager/apiSlices/documents';
import { BodyText, Heading3 } from 'components/common/Typography';
import { BaseTheme } from 'styles/Theme';
import { Await } from 'react-router';
import { SimpleTreeView as TreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFolder,
    faFileAudio,
    faFilePdf,
    faFolderOpen,
    faFileVideo,
    faFileMusic,
    faFileZipper,
    faFile,
    faFileDoc,
    faFileSpreadsheet,
    faFilePowerpoint,
    faFileImage,
    faLink,
    faChainBroken,
    faChevronDown,
    faChevronRight,
    faFaceThinking,
} from '@fortawesome/pro-regular-svg-icons';
import { Link } from 'components/common/Navigation';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { useEngagementLoaderData } from 'components/engagement/preview/PreviewLoaderDataContext';
import { resolveTranslationValue } from 'components/engagement/public/view/engagementTranslationResolution';

interface DocumentTreeProps {
    documentItem: DocumentItem;
    expandedItems?: string[]; // Pass down the list of expanded item IDs to determine folder icon state
}

const iconSize = '20px';
const folderSize = '24px';
const chevronSize = '14px';

const getFileIcon = (url: string, isFile: boolean) => {
    if (!isFile) {
        return url ? faLink : faChainBroken;
    }
    // If there is no extension, it is a link rather than a file
    if (!url.includes('.')) {
        return faLink;
    }
    switch (url.split('.').pop()) {
        case 'pdf':
            return faFilePdf;
        case 'zip':
            return faFileZipper;
        case 'mid':
        case 'midi':
            return faFileMusic;
        case 'doc':
        case 'docx':
            return faFileDoc;
        case 'xls':
        case 'xlsx':
            return faFileSpreadsheet;
        case 'ppt':
        case 'pptx':
            return faFilePowerpoint;
        case 'mp3':
        case 'wav':
        case 'flac':
        case 'ogg':
        case 'm4a':
        case 'wma':
            return faFileAudio;
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'wmv':
        case 'flv':
        case 'mkv':
            return faFileVideo;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'bmp':
        case 'tiff':
        case 'webp':
            return faFileImage;
        default:
            return faFile;
    }
};

const treeItemStyles = (isFolder: boolean) => ({
    color: 'text.primary',
    '& .MuiTreeItem-label': {
        lineHeight: '28px',
        fontWeight: isFolder ? 700 : 400,
    },
    '& div.MuiTreeItem-content': {
        padding: '0.25em 0.75em',
        marginTop: '0.25em',
        marginBottom: '0.25em',
    },
    userSelect: 'none',
});

const CollapseIcon = () => (
    <FontAwesomeIcon
        icon={faChevronDown}
        style={{
            color: BaseTheme.palette.primary.main,
            width: chevronSize,
            height: chevronSize,
        }}
    />
);

const ExpandIcon = () => (
    <FontAwesomeIcon
        icon={faChevronRight}
        style={{
            width: chevronSize,
            height: chevronSize,
        }}
    />
);

const DocumentIcon = (documentItem: DocumentItem) => {
    if (documentItem.type === DOCUMENT_TYPE.FOLDER) {
        return null;
    } else {
        return (
            <FontAwesomeIcon
                icon={getFileIcon(documentItem.url ?? '', documentItem.is_uploaded ?? false)}
                style={{ height: iconSize, maxWidth: iconSize }}
            />
        );
    }
};

const ThinkingIcon = () => <FontAwesomeIcon icon={faFaceThinking} style={{ height: iconSize, color: 'inherit' }} />;

const RecursiveDocumentTree = ({ documentItem, expandedItems }: DocumentTreeProps) => {
    const renderEmptyFolder = () => (
        <TreeItem
            sx={{ '& div.MuiTreeItem-content.Mui-disabled': { cursor: 'not-allowed' } }}
            disabled
            itemId={`${documentItem.id}-empty`}
            color="text.secondary"
            slots={{ icon: ThinkingIcon }}
            label={
                <BodyText color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Folder is empty
                </BodyText>
            }
        />
    );

    return (
        <TreeItem
            sx={treeItemStyles(documentItem.type === DOCUMENT_TYPE.FOLDER)}
            itemId={documentItem.id.toString()}
            label={<DocumentLabel documentItem={documentItem} expandedItems={expandedItems} />}
            slots={{ icon: () => DocumentIcon(documentItem) }}
        >
            {documentItem.children?.map((document: DocumentItem) => (
                <RecursiveDocumentTree key={document.id} documentItem={document} />
            ))}
            {documentItem.type === DOCUMENT_TYPE.FOLDER && !documentItem.children?.length && renderEmptyFolder()}
        </TreeItem>
    );
};

const DocumentLabel = ({ documentItem, expandedItems }: DocumentTreeProps) =>
    documentItem.type === DOCUMENT_TYPE.FOLDER ? (
        <BodyText color="inherit" fontWeight="inherit" lineHeight="inherit" my="2px">
            <FontAwesomeIcon
                icon={expandedItems?.includes(documentItem.id.toString()) ? faFolderOpen : faFolder}
                style={{
                    verticalAlign: '-5px',
                    marginRight: '0.75em',
                    color: expandedItems?.includes(documentItem.id.toString())
                        ? BaseTheme.palette.primary.main
                        : 'inherit',
                    height: folderSize,
                    width: folderSize,
                }}
            />
            {documentItem.title}
        </BodyText>
    ) : (
        <BodyText lineHeight="inherit">
            <Link
                to={documentItem.url ?? ''}
                underline="hover"
                color="text.primary"
                lineHeight="inherit"
                target="_blank"
            >
                {documentItem.title}
            </Link>
            <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                style={{ marginLeft: '0.5em', height: '12px', width: '12px', verticalAlign: 'baseline' }}
            />
        </BodyText>
    );

// Skeleton component for the DocumentWidget
const DocumentWidgetSkeleton = () => (
    <Grid container spacing={0.5}>
        {['folder-1', 'folder-2', 'folder-3'].map((folderKey) => (
            // Simulate a folder with a title and two subitems
            <Grid size={12} key={folderKey} sx={{ mb: 1 }}>
                <Skeleton variant="text" width="60%" height={20} />
                <Grid container spacing={0.5} sx={{ pl: 3, mt: 0.5 }}>
                    {['subitem-1', 'subitem-2'].map((subitemKey) => (
                        <Grid size={12} key={`${folderKey}-${subitemKey}`}>
                            <Skeleton variant="text" width="40%" height={15} />
                        </Grid>
                    ))}
                </Grid>
            </Grid>
        ))}
    </Grid>
);

interface DocumentWidgetProps {
    widget: Widget;
}
const DocumentWidget = ({ widget }: DocumentWidgetProps) => {
    const [getDocuments] = useLazyGetDocumentsQuery();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const documents = useMemo(() => getDocuments(widget.id, false).unwrap(), [widget.id]);
    const { translationBundle } = useEngagementLoaderData();
    const loadedTranslationBundle = React.use(translationBundle);

    const currentDocumentTranslationsById = useMemo(
        () =>
            new Map(
                loadedTranslationBundle.currentContentTranslations.documents_widgets.map((translation) => [
                    translation.widget_documents_id,
                    translation,
                ]),
            ),
        [loadedTranslationBundle.currentContentTranslations.documents_widgets],
    );
    const defaultDocumentTranslationsById = useMemo(
        () =>
            new Map(
                loadedTranslationBundle.defaultContentTranslations.documents_widgets.map((translation) => [
                    translation.widget_documents_id,
                    translation,
                ]),
            ),
        [loadedTranslationBundle.defaultContentTranslations.documents_widgets],
    );

    const applyDocumentTranslations = (items: DocumentItem[]): DocumentItem[] => {
        return items.map((item) => ({
            ...item,
            title:
                resolveTranslationValue<string>({
                    translatedValue: currentDocumentTranslationsById.get(item.id)?.title,
                    defaultValue: defaultDocumentTranslationsById.get(item.id)?.title,
                    baseValue: item.title,
                }).value ?? item.title,
            children: item.children ? applyDocumentTranslations(item.children) : item.children,
        }));
    };

    return (
        <Grid container size={12} gap="1rem">
            <Grid size={12}>
                <Heading3 weight="thin">{widget.title}</Heading3>
            </Grid>
            <Grid
                size={12}
                component={Paper}
                direction="column"
                sx={{
                    mt: '1.5rem',
                    bgcolor: 'white',
                    padding: '2em 1em',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: 'blue.90',
                }}
            >
                <section aria-label="Document Tree Widget" style={{ flexGrow: 1 }}>
                    <ThemeProvider theme={BaseTheme}>
                        <Suspense fallback={<DocumentWidgetSkeleton />}>
                            <Grid container spacing={1} rowSpacing={1} size={12} flexGrow={1}>
                                <TreeView
                                    onItemExpansionToggle={(_event, itemId, expanded) => {
                                        setExpandedItems((prevExpanded) =>
                                            expanded
                                                ? [...prevExpanded, itemId]
                                                : prevExpanded.filter((id) => id !== itemId),
                                        );
                                    }}
                                    sx={{
                                        mt: '-0.5rem',
                                        mb: '-0.5rem',
                                        width: '100%',
                                        '& .Mui-expanded .MuiTreeItem-label': {
                                            color: BaseTheme.palette.primary.main,
                                        },
                                        '& .MuiTreeItem-iconContainer': {
                                            alignItems: 'center',
                                            justifyContent: 'flex-start',
                                        },
                                        '& .MuiTreeItem-groupTransition': {
                                            marginLeft: '3.75em',
                                        },
                                    }}
                                    slots={{
                                        collapseIcon: CollapseIcon,
                                        expandIcon: ExpandIcon,
                                    }}
                                >
                                    <Await resolve={documents}>
                                        {(documents: DocumentItem[]) => {
                                            const translatedDocuments = applyDocumentTranslations(documents);
                                            return translatedDocuments.map((document: DocumentItem) => {
                                                return (
                                                    <RecursiveDocumentTree
                                                        expandedItems={expandedItems}
                                                        documentItem={document}
                                                        key={document.id}
                                                    />
                                                );
                                            });
                                        }}
                                    </Await>
                                </TreeView>
                            </Grid>
                        </Suspense>
                    </ThemeProvider>
                </section>
            </Grid>
        </Grid>
    );
};

export default DocumentWidget;
