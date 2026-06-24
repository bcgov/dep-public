import React, { useState } from 'react';
import { Form } from './formio/setup';
import { FormSubmissionData, FormSubmitterProps } from './types';
import FormStepper from 'components/survey/submit/Stepper';

interface PageData {
    page: number;
    submission: unknown;
}

const MultiPageForm = ({ handleFormChange, savedForm, handleFormSubmit }: FormSubmitterProps) => {
    const [currentPage, setCurrentPage] = useState(0);

    const handleScrollUp = () => {
        globalThis.scrollTo({
            top: 100,
            behavior: 'smooth',
        });
    };

    return (
        <div className="formio">
            <FormStepper currentPage={currentPage} pages={savedForm?.components ?? []} />
            <Form
                form={savedForm || { display: 'wizard' }}
                options={{ noAlerts: true }}
                onChange={(form: unknown) => handleFormChange(form as FormSubmissionData)}
                onNextPage={(pageData: PageData) => {
                    setCurrentPage(pageData.page);
                    handleScrollUp();
                }}
                onPrevPage={(pageData: PageData) => {
                    setCurrentPage(pageData.page);
                    handleScrollUp();
                }}
                onSubmit={(form: unknown) => {
                    const formSubmissionData = form as FormSubmissionData;
                    handleFormSubmit(formSubmissionData.data);
                }}
            />
        </div>
    );
};

export default MultiPageForm;
