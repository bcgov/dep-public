import React from 'react';
import { Grid2 as Grid, useMediaQuery, Theme } from '@mui/material';
import { colors } from '..';
import { Button } from './Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { BodyText } from '../Typography';
import { useAppTranslation } from 'hooks';

const buttonStyles = {
    borderRadius: '8px',
    height: '44px',
    minWidth: '44px',
    padding: '0.625rem',
    border: `1px solid ${colors.surface.gray[60]} !important`,
    fontSize: { xs: '12px', sm: '14px' },
    boxShadow: 'none',
    '&.MuiButton-containedPrimary': {
        backgroundColor: colors.surface.blue[80],

        '&:disabled': {
            color: 'white',
        },
    },
};

interface PaginationProps {
    page: number;
    count: number;
    onChange: (event: React.ChangeEvent<unknown>, page: number) => void | undefined;
}

/**
 * A custom pagination component.
 * It includes icon + text previous/next buttons, <page> of <count> summary, and custom page number display logic.
 * Custom styling and conditional mobile rendering are also utilized.
 * @param {PaginationProps} props - Props to pass to the pagination component.
 * @param {number} props.page - The currently selected page of the pagination.
 * @param {number} props.count - The total number of pages for the pagination.
 * @param {function} props.onChange - The propagating onChange event that triggers the onChange callback function in the parent component.
 * @returns {JSX.Element | null}
 */
export const Pagination = (props: PaginationProps) => {
    const { onChange, page, count } = props;
    if (!page || !Number.isFinite(page) || !count || !Number.isFinite(count) || !onChange) return null;

    const { t: translate } = useAppTranslation();
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true });

    return (
        <Grid container alignItems="center" gap={1} flexDirection={{ xs: 'column', sm: 'row' }}>
            <Grid container component="nav" alignItems="center" flexWrap="nowrap" gap={{ xs: 0.5, md: 1 }}>
                <Button
                    aria-label="Go to previous page"
                    sx={{ ...buttonStyles, p: isMobile ? '0 1rem' : '0 1.5rem' }}
                    startIcon={isMobile ? null : <FontAwesomeIcon icon={faChevronLeft} />}
                    disabled={page === 1}
                    onClick={(e) => onChange(e as unknown as React.ChangeEvent<unknown>, Math.max(1, page - 1))}
                >
                    {translate('common.paginationPrevious')}
                </Button>

                <PageList page={page} count={count} onChange={onChange} />

                <Button
                    aria-label="Go to next page"
                    sx={{ ...buttonStyles, p: isMobile ? '0 1rem' : '0 1.5rem' }}
                    endIcon={isMobile ? null : <FontAwesomeIcon icon={faChevronRight} />}
                    disabled={page === count}
                    onClick={(e) => onChange(e as unknown as React.ChangeEvent<unknown>, Math.min(count, page + 1))}
                >
                    {translate('common.paginationNext')}
                </Button>
            </Grid>

            <BodyText
                aria-label={`Currently on page ${page} of ${count}`}
                p="8px"
                fontWeight={400}
                color={colors.surface.gray[80]}
            >
                {`${translate('common.paginationPage')} ${page} ${translate('common.paginationOf')} ${count}`}
            </BodyText>
        </Grid>
    );
};

const PageList = (props: PaginationProps) => {
    const { page, count, onChange } = props;

    // First page
    const pageButtons = [1];
    // Start ellipsis
    if (page > 3) {
        pageButtons.push(-2);
    }
    // Page before current page
    if (page > 2 && page <= count) {
        pageButtons.push(page - 1);
    }
    // Current page
    if (page > 1 && page <= count) {
        pageButtons.push(page);
    }
    // Page after current page
    if (page > 0 && page < count - 1) {
        pageButtons.push(page + 1);
    }
    // End ellipsis
    if (page < count - 2) {
        pageButtons.push(-1);
    }
    // Last page
    if (!pageButtons.includes(count)) {
        pageButtons.push(count);
    }

    return (
        <Grid container gap={0.5} alignItems="flex-end" flexWrap="nowrap">
            {pageButtons.map((pb) => {
                const isCurrentPage = pb === page;
                if (pb > 0) {
                    return (
                        <Button
                            aria-label={`Go to page ${pb}`}
                            key={`page-${pb}`}
                            disabled={isCurrentPage ? true : undefined}
                            variant={isCurrentPage ? 'primary' : 'secondary'}
                            sx={buttonStyles}
                            onClick={(e) => onChange(e as unknown as React.ChangeEvent<unknown>, pb)}
                        >
                            {pb}
                        </Button>
                    );
                }
                return (
                    <BodyText
                        aria-hidden="true"
                        key={pb === -2 ? 'startEllipsis' : 'endEllipsis'}
                        style={{ padding: '0 4px' }}
                    >
                        ...
                    </BodyText>
                );
            })}
        </Grid>
    );
};
