import React, { useState } from 'react';
import { Form } from './formio/setup';
import { FormSubmissionData, FormSubmitterProps } from './types';
import FormStepper from 'components/survey/submit/Stepper';
import { createSimpleFileOptions } from './formio/simpleFileOptions';

interface PageData {
    page: number;
    submission: unknown;
}

const MultiPageForm = ({
    handleFormChange,
    handleFormCancel,
    savedForm,
    handleFormSubmit,
    verificationToken,
}: FormSubmitterProps) => {
    const [currentPage, setCurrentPage] = useState(0);
    const options = createSimpleFileOptions({ verificationToken, noAlerts: true });
    const handleChangePage = (pageData: PageData) => {
        setCurrentPage(pageData.page);
        globalThis.scrollTo({
            top: 100,
            behavior: 'smooth',
        });
    };

    return (
        <div className="formio multipageform form-wrapper">
            <FormStepper currentPage={currentPage} pages={savedForm?.components ?? []} />
            <Form
                form={savedForm || { display: 'wizard' }}
                options={options}
                onChange={(form: unknown) => handleFormChange(form as FormSubmissionData)}
                onNextPage={handleChangePage}
                onPrevPage={handleChangePage}
                onCancel={() => handleFormCancel?.()}
                onSubmit={(form: unknown) => handleFormSubmit?.((form as FormSubmissionData).data)}
            />
        </div>
    );
};

export default MultiPageForm;
