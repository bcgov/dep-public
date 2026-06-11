import React, { useId, useRef, useState } from 'react';
import {
    ButtonBase,
    Grid2 as Grid,
    MenuList,
    Popper,
    ClickAwayListener,
    MenuListProps,
    ButtonBaseProps,
    PopperProps,
} from '@mui/material';
import TrapFocus from '@mui/material/Unstable_TrapFocus';
import { colors } from 'styles/Theme';
import { BodyText } from 'components/common/Typography/Body';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { When, Unless } from 'react-if';
import { elevations } from 'components/common';

export const dropdownMenuStyles = {
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid transparent',
    '&:hover': { backgroundColor: colors.surface.blue[80] },
    '&:focus-visible': {
        backgroundColor: colors.surface.blue[80],
        border: '1px dashed white',
    },
};

export const ToggleNav = ({ isNav, children }: { isNav?: boolean; children: React.ReactNode }) => {
    if (isNav) {
        return <nav>{children}</nav>;
    }
    return <>{children}</>;
};

/**
 * A dropdown menu component that expands on click and allows for navigation or selection.
 * It supports custom button content, click-away behavior, and focus trapping.
 *
 * @param {MenuListProps} [props] - Additional properties for the MenuList component.
 * @param {string} [props.name] - The name of the dropdown menu, used for accessibility.
 * @param {boolean} [props.forNavigation=false] - If true, wraps the menu in a <nav> element for accessibility.
 * @param {function} [props.renderButtonContent] - A function that returns custom content for the dropdown button.
 * @param {ButtonBaseProps} [props.buttonProps] - Additional properties for the button.
 * @param {PopperProps} [props.popperProps] - Additional properties for the Popper component.
 * @param {React.ReactNode} [props.children] - The menu items to display within the dropdown.
 * @returns {JSX.Element} A dropdown menu component that can be used for navigation or selection.
 * @example
 * <DropdownMenu
 *   name="Options"
 *   renderButtonContent={({ isOpen }) => (
 *     <span>{isOpen ? 'Close Menu' : 'Open Menu'}</span>
 *   )}
 *   buttonProps={{ color: 'primary' }}
 *   popperProps={{ placement: 'bottom-end' }}
 * >
 *   <MenuItem onClick={() => globalThis.location.href = '/option1'}>
 *     Option 1
 *   </MenuItem>
 *   <MenuItem onClick={() => globalThis.location.href = '/option2'}>
 *     Option 2
 *   </MenuItem>
 * </DropdownMenu>
 * */

export const DropdownMenu = ({
    name,
    forNavigation,
    renderButtonContent,
    buttonProps,
    children,
    popperProps,
    ...props
}: {
    name?: string;
    forNavigation?: boolean;
    renderButtonContent?: ({ isOpen }: { isOpen: boolean }) => React.ReactNode;
    buttonProps?: ButtonBaseProps;
    popperProps?: Partial<PopperProps>;
    children?: React.ReactNode;
} & MenuListProps) => {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownId = useId();

    return (
        <>
            {/* Dropdown Button */}
            <ButtonBase
                ref={buttonRef}
                aria-haspopup
                aria-controls={open ? dropdownId : undefined}
                aria-expanded={open}
                aria-label={name || 'Dropdown Menu'}
                onClick={() => {
                    setOpen(!open);
                }}
                {...buttonProps}
                sx={{
                    ...dropdownMenuStyles,
                    ...buttonProps?.sx,
                }}
            >
                {/* Pass the "open" state to the button contents in case they want to change based on dropdown state */}
                <Unless condition={renderButtonContent === undefined}>{renderButtonContent?.({ isOpen: open })}</Unless>
                {/* A basic button label if no custom content is provided */}
                <When condition={renderButtonContent === undefined}>
                    <Grid container direction="row" alignItems="center" spacing={1}>
                        <Grid>
                            <BodyText sx={{ userSelect: 'none', textTransform: 'capitalize' }}>{name}</BodyText>
                        </Grid>
                        <Grid hidden={!children}>
                            <FontAwesomeIcon color="white" icon={faChevronDown} rotation={open ? 180 : undefined} />
                        </Grid>
                    </Grid>
                </When>
            </ButtonBase>
            <ClickAwayListener
                mouseEvent="onMouseUp"
                onClickAway={(e) => {
                    if (e.target !== buttonRef.current && !buttonRef.current?.contains(e.target as Node))
                        setOpen(false);
                }}
            >
                {/* Dropdown Contents */}
                <Popper
                    onKeyDown={(e) => {
                        // listen for escape key to close menu
                        if (e.key === 'Escape') setOpen(false);
                    }}
                    id={dropdownId}
                    anchorEl={buttonRef.current}
                    placement="bottom-start"
                    modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
                    open={open}
                    {...popperProps}
                    sx={{
                        zIndex: 10000,
                        boxShadow: elevations.default,
                        backgroundColor: colors.surface.blue[90],
                        padding: '2px',
                        borderRadius: '16px',
                        minWidth: 'fit-content',
                        width: buttonRef.current?.offsetWidth,
                        ...popperProps?.sx,
                    }}
                >
                    <ToggleNav isNav={forNavigation}>
                        <TrapFocus open={open}>
                            <MenuList
                                sx={{ minWidth: 'fit-content' }}
                                aria-label={name || 'Dropdown Menu'}
                                tabIndex={-1}
                                aria-expanded={open}
                                autoFocusItem
                                {...props}
                            >
                                {children}
                            </MenuList>
                        </TrapFocus>
                    </ToggleNav>
                </Popper>
            </ClickAwayListener>
        </>
    );
};
export default DropdownMenu;
