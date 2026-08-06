import React from 'react';
import {
    Grid2 as Grid,
    Box,
    Pagination as MuiPagination,
    PaginationItem,
    PaginationProps,
    PaginationRenderItemParams,
    styled,
    useMediaQuery,
    Theme,
} from '@mui/material';
import { colors } from '..';
import { Button } from './Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { BodyText } from '../Typography';
import { useAppTranslation } from 'hooks';

const StyledPaginationItem = styled(PaginationItem)(() => ({
    minWidth: 44,
    height: 44,
    borderRadius: 8,
    border: `1px solid ${colors.surface.gray[60]}`,
    backgroundColor: 'white',

    '&.Mui-selected': {
        backgroundColor: colors.surface.blue[80],
        color: 'white',

        '&:hover': {
            backgroundColor: colors.surface.blue[80],
        },
    },

    '&.MuiPaginationItem-root:hover': {
        transition: 'box-shadow 0.25s',
        boxShadow:
            '0px 5px 6px 0px rgba(0, 0, 0, 0.20), ' +
            '0px 9px 12px 0px rgba(0, 0, 0, 0.14), ' +
            '0px 3px 16px 0px rgba(0, 0, 0, 0.12)',
    },

    '&.MuiPaginationItem-ellipsis': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '1.5rem',
        minWidth: '1.5rem',
        padding: 0,
        margin: 0,
        border: 'none',
    },
}));

const buttonStyles = {
    height: '44px',
    color: colors.surface.gray[110],
    borderColor: `${colors.surface.gray[60]} !important`,
    fontSize: '14px',
    boxShadow: 'none',
};

/**
 * A pagination component that wraps around the MUI Pagination component.
 * It includes icon + text previous/next buttons, <page> of <count> summary, custom neighbour and first/last behavior.
 * Custom styling and conditional mobile rendering are also utilized.
 * @param {PaginationProps} props - Props to pass to the MUIPagination component.
 * @param {number} props.page - The currently selected page of the pagination.
 * @param {number} props.count - The total number of pages for the pagination.
 * @param {function} props.onChange - The propagating onChange event that triggers the onChange callback function in the parent component.
 * @returns {JSX.Element | null}
 * @see {@link https://mui.com/material-ui/api/pagination/} for more details on the MUI Pagination API.
 */
export const Pagination: React.FC<PaginationProps> = (props) => {
    const { t: translate } = useAppTranslation();
    const { onChange, page, count } = props;
    if (!page || !count || !onChange) return null;
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true });

    const buttonIsVisible = (item: PaginationRenderItemParams): boolean => {
        // Ellipsis -> true
        if (item.type === 'start-ellipsis' || item.type === 'end-ellipsis') return true;
        // Render item's page value is not valid -> false
        if (!item.page) return false;
        // Page is within -1 or +1 of current page or is the first/last page -> true
        return Math.abs(item.page - page) <= 1 || item.page === 1 || item.page === count;
    };

    return (
        <Grid display="flex" alignItems="center" gap={1} flexDirection={{ xs: 'column', sm: 'row' }} maxWidth="100%">
            <Box display="flex" alignItems="center" gap={1}>
                <Button
                    aria-label="previous page"
                    sx={{ ...buttonStyles, p: isMobile ? '0 1rem' : '0 1.5rem' }}
                    startIcon={isMobile ? null : <FontAwesomeIcon icon={faChevronLeft} />}
                    disabled={page === 1}
                    onClick={(e) => onChange(e as unknown as React.ChangeEvent<unknown>, Math.max(1, page - 1))}
                >
                    {translate('common.paginationPrevious')}
                </Button>

                <MuiPagination
                    sx={{ '& ul': { flexWrap: 'nowrap' } }}
                    {...props}
                    page={page}
                    count={count}
                    hidePrevButton
                    hideNextButton
                    showFirstButton={false} // Using custom button for this
                    showLastButton={false} // Using custom button for this
                    siblingCount={1}
                    boundaryCount={1}
                    renderItem={(item) => {
                        return buttonIsVisible(item) ? <StyledPaginationItem {...item} /> : null;
                    }}
                />

                <Button
                    aria-label="next page"
                    sx={{ ...buttonStyles, p: isMobile ? '0 1rem' : '0 1.5rem' }}
                    endIcon={isMobile ? null : <FontAwesomeIcon icon={faChevronRight} />}
                    disabled={page === count}
                    onClick={(e) => onChange(e as unknown as React.ChangeEvent<unknown>, Math.min(count, page + 1))}
                >
                    {translate('common.paginationNext')}
                </Button>
            </Box>

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
