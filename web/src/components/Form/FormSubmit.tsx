import React from 'react';
import { FormSubmitterProps } from './types';
import SinglePageForm from './SinglePageForm';
import MultiPageForm from './MultiPageForm';

const FormSubmit = ({
    handleFormChange,
    handleFormCancel,
    savedForm,
    handleFormSubmit,
    verificationToken,
}: FormSubmitterProps) => {
    const FormComponent = savedForm?.display === 'wizard' ? MultiPageForm : SinglePageForm;

    return (
        <FormComponent
            handleFormChange={handleFormChange}
            handleFormCancel={handleFormCancel}
            savedForm={savedForm}
            handleFormSubmit={handleFormSubmit}
            verificationToken={verificationToken}
        />
    );
};

export default FormSubmit;
