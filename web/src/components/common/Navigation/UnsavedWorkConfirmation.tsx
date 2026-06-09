import { Modal } from '@mui/material';
import React, { useEffect } from 'react';
import { useBlocker } from 'react-router';
import ConfirmModal from '../Modals/ConfirmModal';
import { faFileCircleQuestion } from '@fortawesome/pro-regular-svg-icons';

interface UnsavedWorkConfirmationProps {
    blockNavigationWhen: boolean;
}

/**
 * Displays a confirmation modal when there are unsaved changes and the user attempts to navigate away.
 * It blocks navigation until the user confirms they want to leave, potentially losing unsaved changes.
 * Can be placed anywhere in the component tree where navigation blocking is needed.
 * @param {UnsavedWorkConfirmationProps} props - The properties for the UnsavedWorkConfirmation component.
 * @param {boolean} props.blockNavigationWhen - If true, the modal will be displayed when there are unsaved changes.
 * @returns {JSX.Element} A modal component that prompts the user to confirm navigation away from the page.
 * @example
 * const hasUnsavedWork = useState(true); // Example state to track unsaved work
 * <UnsavedWorkConfirmation blockNavigationWhen={hasUnsavedWork} />
 * @see {@link ConfirmModal} for the modal structure and behavior.
 * @see {@link useBlocker} for handling navigation blocking in React Router.
 */
const UnsavedWorkConfirmation: React.FC<UnsavedWorkConfirmationProps> = ({ blockNavigationWhen }) => {
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            blockNavigationWhen && nextLocation.pathname !== currentLocation.pathname,
    );

    // Prevent refresh/navigation at the browser level if there are unsaved changes
    useEffect(() => {
        if (!blockNavigationWhen) return;
        const handler = (event: BeforeUnloadEvent) => {
            event.preventDefault();
        };
        globalThis.addEventListener('beforeunload', handler);
        return () => globalThis.removeEventListener('beforeunload', handler);
    }, [blockNavigationWhen]);

    // If navigating at the SPA level, show a nicer confirmation modal
    return (
        <Modal open={blocker.state === 'blocked'} onClose={blocker.reset}>
            <ConfirmModal
                style="warning"
                header="Unsaved Changes"
                icon={faFileCircleQuestion}
                subHeader="Are you sure you want to leave this page?"
                subText={[{ text: 'If you leave this page, your changes will be lost.' }]}
                cancelButtonText="Stay"
                confirmButtonText="Leave"
                handleClose={blocker.reset}
                handleConfirm={blocker.proceed}
            />
        </Modal>
    );
};

export default UnsavedWorkConfirmation;
