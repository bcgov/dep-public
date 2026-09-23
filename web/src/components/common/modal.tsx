import React from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import Modal from '@mui/material/Modal';
import { closeNotificationModal } from 'services/notificationModalService/notificationModalSlice';
import UpdateModal from './Modals/UpdateModal';
import ConfirmModal from './Modals/ConfirmModal';
import { When } from 'react-if';

export const NotificationModal = () => {
    const dispatch = useAppDispatch();
    const open = useAppSelector((state) => state.notificationModal.open);
    const { style, header, subHeader, subText, handleClose, handleConfirm, confirmButtonText, cancelButtonText, icon } =
        useAppSelector((state) => state.notificationModal.data);
    const type = useAppSelector((state) => state.notificationModal.type);

    function _handleClose() {
        if (handleClose) handleClose();
        dispatch(closeNotificationModal());
    }

    function _handleConfirm() {
        if (handleConfirm) handleConfirm();
        dispatch(closeNotificationModal());
    }

    return (
        <Modal
            open={open}
            onClose={_handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <>
                <When condition={type === 'update'}>
                    <UpdateModal style={style} header={header} subText={subText} handleClose={_handleClose} />
                </When>
                <When condition={type === 'confirm'}>
                    <ConfirmModal
                        icon={icon}
                        style={style}
                        header={header}
                        subHeader={subHeader}
                        subText={subText}
                        handleConfirm={_handleConfirm}
                        handleClose={_handleClose}
                        confirmButtonText={confirmButtonText}
                        cancelButtonText={cancelButtonText}
                    />
                </When>
            </>
        </Modal>
    );
};
