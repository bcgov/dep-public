import { Grid2 as Grid, Box, Paper, IconButton, Modal, Typography, Chip, Fade } from '@mui/material';
import { ThemeProvider, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-regular-svg-icons/faXmark';
import { faChevronDown } from '@fortawesome/pro-solid-svg-icons/faChevronDown';
import { faChevronUp } from '@fortawesome/pro-solid-svg-icons/faChevronUp';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { reorder } from 'utils';
import { MetadataTaxon } from 'models/engagement';
import { DroppableBox } from 'components/common/Dragdrop';
import { ActionContext } from './ActionContext';
import TaxonEditForm from './TaxonEditForm';
import { Else, If, Then } from 'react-if';
import { TaxonCard, TaxonCardSkeleton } from './TaxonCard';
import { Button } from 'components/common/Input/Button';
import { faArrowsFromLine, faArrowsToLine, faPlusCircle } from '@fortawesome/pro-regular-svg-icons';
import { BodyText, Heading1 } from 'components/common/Typography';
import { DarkTheme, BaseTheme } from 'styles/Theme';

export const TaxonEditor = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'));
    const { metadataTaxa, reorderMetadataTaxa, createMetadataTaxon, selectedTaxon, setSelectedTaxonId, isLoading } =
        useContext(ActionContext);
    const orderedMetadataTaxa = useMemo(() => metadataTaxa, [metadataTaxa]);
    const [expandedCards, setExpandedCards] = useState<boolean[]>(new Array(metadataTaxa.length).fill(false));

    const setCardExpanded = (index: number, state: boolean) => {
        setExpandedCards((prevExpandedCards) => {
            const newExpandedCards = [...prevExpandedCards]; // create a copy
            newExpandedCards[index] = state; // update the copy
            return newExpandedCards; // return the updated copy
        });
    };

    const expandAll = () => {
        setExpandedCards(new Array(metadataTaxa.length).fill(true));
    };

    const collapseAll = () => {
        setExpandedCards(new Array(metadataTaxa.length).fill(false));
        setSelectedTaxonId(-1);
    };

    const repositionTaxon = (result: DropResult) => {
        if (!result.destination) {
            return;
        }
        const items = reorder(metadataTaxa, result.source.index, result.destination.index);
        reorderMetadataTaxa(items.map((taxon) => taxon.id));
    };

    const handleSelectTaxon = (taxon: MetadataTaxon) => {
        if (taxon.id === selectedTaxon?.id) {
            setSelectedTaxonId(-1);
        } else {
            setSelectedTaxonId(taxon.id);
        }
    };

    const handleExpandTaxon = (taxon: MetadataTaxon) => {
        const index = orderedMetadataTaxa.findIndex((t) => t.id === taxon.id);
        if (index === -1) {
            return;
        }
        setCardExpanded(index, !expandedCards[index]);
    };

    const addTaxon = async () => {
        const newTaxon = await createMetadataTaxon({
            name: 'New Taxon',
            data_type: 'text',
            freeform: true,
            one_per_engagement: true,
        });
        if (newTaxon) {
            setSelectedTaxonId(newTaxon.id);
        }
        setTimeout(() => {
            scrollableRef.current?.scrollTo({ top: scrollableRef.current?.scrollHeight, behavior: 'smooth' });
        }, 1); // Wait for the new taxon to be rendered before scrolling
    };

    const [showScrollIndicators, setShowScrollIndicators] = useState({
        top: false,
        bottom: false,
    });

    const scrollableRef = useRef<HTMLDivElement>(null);

    const checkScroll = useCallback(() => {
        if (!scrollableRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollableRef.current;
        const scrollMargin = 20;
        setShowScrollIndicators({
            top: scrollTop > scrollMargin,
            bottom: scrollTop < scrollHeight - clientHeight - scrollMargin,
        });
    }, []);

    useEffect(() => {
        const currentRef = scrollableRef.current;
        if (!currentRef) return;
        currentRef.addEventListener('scroll', checkScroll);
        // Initial check
        checkScroll();

        return () => currentRef.removeEventListener('scroll', checkScroll);
    }, [checkScroll]);

    useEffect(() => {
        // Call checkScroll with a delay after any expansion/collapse animation completes
        const timer = setTimeout(() => {
            checkScroll();
        }, 300);

        return () => clearTimeout(timer); // Cleanup the timer if the component unmounts or if expandedCards changes again before the timer fires
    }, [expandedCards, checkScroll]); // Depend on expandedCards and checkScroll

    const scroll = (amount: number) => {
        const scrollableDiv = scrollableRef.current;
        if (scrollableDiv) {
            scrollableDiv.scrollBy({ top: amount, behavior: 'smooth' });
        }
    };

    return (
        <Grid container size={12} gap={1}>
            <Grid size={12}>
                <Heading1 mt={0} mb={1}>
                    Metadata Management
                </Heading1>
            </Grid>
            <Grid size={12}>
                <BodyText mb={1}>Manage the ways metadata is collected and organized for your engagements.</BodyText>
            </Grid>
            <Grid size={12} container gap={2} my={'0.5rem'}>
                <Button
                    size="small"
                    variant="primary"
                    onClick={addTaxon}
                    icon={<FontAwesomeIcon icon={faPlusCircle} />}
                >
                    Add Taxon
                </Button>
                <Button
                    size="small"
                    onClick={expandAll}
                    icon={<FontAwesomeIcon icon={faArrowsFromLine} />}
                    aria-label="Expand All Taxon Cards"
                >
                    Expand All
                </Button>
                <Button
                    size="small"
                    onClick={collapseAll}
                    aria-label="Collapse All Taxon Cards"
                    icon={<FontAwesomeIcon icon={faArrowsToLine} />}
                >
                    Collapse All
                </Button>
            </Grid>
            <Grid container size={12} gap={2}>
                <Grid
                    size={6}
                    component={Paper}
                    sx={{
                        padding: '1em',
                        // Distinguish from child components
                        backgroundColor: '#f5f5f5',
                    }}
                    elevation={3}
                >
                    <Fade in={showScrollIndicators.top} timeout={300}>
                        <Box
                            sx={{
                                width: '100%',
                                textAlign: 'center',
                                background: 'linear-gradient(#f5f5f5ff, #f5f5f500 100%)',
                                height: '3em',
                                marginBottom: '-3em',
                                position: 'relative',
                                zIndex: 10,
                            }}
                        >
                            <Chip
                                icon={<FontAwesomeIcon icon={faChevronUp} />}
                                variant="filled"
                                color="secondary"
                                label="Scroll for more"
                                onClick={() => {
                                    scroll(-400);
                                }}
                            />
                        </Box>
                    </Fade>
                    <Box
                        sx={{
                            height: '100%',
                            // Enable vertical scrolling
                            overflowY: 'scroll',
                            // Don't hide the scrollbar
                            scrollbarWidth: 'thin',
                            scrollbarColor: `${theme.palette.primary.main} #f5f5f5`,
                            '&::-webkit-scrollbar': {
                                width: '12px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: theme.palette.primary.main,
                            },
                            '&::-webkit-scrollbar-track': {
                                backgroundColor: '#f5f5f5',
                            },
                        }}
                        ref={scrollableRef}
                    >
                        <DragDropContext onDragEnd={repositionTaxon}>
                            <DroppableBox droppableId="metadataTaxa">
                                <Grid container direction="column" width={'100%'} pr={1.5}>
                                    {!isLoading &&
                                        orderedMetadataTaxa.map((taxon: MetadataTaxon, index) => {
                                            return (
                                                <ThemeProvider
                                                    theme={taxon.id === selectedTaxon?.id ? DarkTheme : BaseTheme}
                                                >
                                                    <TaxonCard
                                                        key={taxon.id}
                                                        taxon={taxon}
                                                        index={index}
                                                        onExpand={handleExpandTaxon}
                                                        onSelect={handleSelectTaxon}
                                                        isSelected={taxon.id === selectedTaxon?.id}
                                                        isExpanded={expandedCards[index]}
                                                    />
                                                </ThemeProvider>
                                            );
                                        })}
                                    {isLoading &&
                                        [...Array(8)].map((_, i) => <TaxonCardSkeleton key={`skeleton-${i}`} />)}
                                    {!isLoading && orderedMetadataTaxa.length === 0 && (
                                        <>
                                            <Typography variant="h6" color="textSecondary" align="center">
                                                No taxa found
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" align="center">
                                                Add a new taxon above to get started.
                                            </Typography>
                                        </>
                                    )}
                                </Grid>
                            </DroppableBox>
                        </DragDropContext>
                    </Box>
                    <Fade in={showScrollIndicators.bottom} timeout={300}>
                        <Box
                            sx={{
                                width: '100%',
                                textAlign: 'center',
                                background: 'linear-gradient(#f5f5f500, #f5f5f5ff 100%)',
                                height: '3em',
                                marginTop: '-3em',
                                paddingTop: '1em',
                                position: 'relative',
                                zIndex: 10,
                            }}
                        >
                            <Chip
                                icon={<FontAwesomeIcon icon={faChevronDown} />}
                                variant="filled"
                                color="secondary"
                                label="Scroll for more"
                                onClick={() => {
                                    scroll(400);
                                }}
                            />
                        </Box>
                    </Fade>
                </Grid>
                <If condition={isSmallScreen}>
                    <Then>
                        {selectedTaxon && (
                            <Modal open={true} onClose={() => setSelectedTaxonId(-1)}>
                                <Paper
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        boxShadow: 24,
                                        p: 4,
                                        paddingTop: '0',
                                        width: '80%',
                                        maxWidth: '40em',
                                        minWidth: '320px',
                                        maxHeight: '90vh',
                                        overflowY: 'scroll',
                                    }}
                                >
                                    <IconButton
                                        onClick={() => setSelectedTaxonId(-1)}
                                        sx={{
                                            position: 'absolute',
                                            right: '0.5em',
                                            top: '0.5em',
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faXmark} style={{ fontSize: '20px' }} />
                                    </IconButton>
                                    <Box sx={{ height: '4em' }} />
                                    <TaxonEditForm taxon={selectedTaxon} />
                                </Paper>
                            </Modal>
                        )}
                    </Then>
                    <Else>
                        {selectedTaxon && (
                            <Grid size="grow">
                                <Paper
                                    sx={{
                                        padding: '1rem',
                                        height: '100%',
                                        // Enable vertical scrolling
                                        overflowY: 'scroll',
                                        // Don't hide the scrollbar
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: `${theme.palette.primary.main} #f5f5f5`,
                                        '&::-webkit-scrollbar': {
                                            width: '12px',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            backgroundColor: theme.palette.primary.main,
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            backgroundColor: '#f5f5f5',
                                        },
                                    }}
                                >
                                    <TaxonEditForm taxon={selectedTaxon} />
                                </Paper>
                            </Grid>
                        )}
                    </Else>
                </If>
            </Grid>
        </Grid>
    );
};
