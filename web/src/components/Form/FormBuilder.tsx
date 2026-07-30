import React, { useEffect, useRef } from 'react';
import { FormBuilder as FormioFormBuilder } from './formio/setup';
import { formioOptions } from './FormBuilderOptions';
import { FormBuilderData, FormBuilderProps } from './types';
import { createSimpleFileOptions } from './formio/simpleFileOptions';

const FormBuilder = ({ handleFormChange, savedForm }: FormBuilderProps) => {
    const formioRootRef = useRef<HTMLDivElement>(null);

    // Add file upload and other handlers for Formio to call when uploading files.
    const fileUploadOptions = createSimpleFileOptions();

    // Add accessibility attributes to Formio buttons and wizard tabs,
    // and handle keyboard navigation for wizard tabs.
    useEffect(() => {
        const formioRoot = formioRootRef.current;
        if (!formioRoot) return;

        let pendingFocusIndex: number | null = null;

        const getAllButtons = () => Array.from(formioRoot.querySelectorAll<HTMLDivElement>('div.btn, span.btn'));

        const getWizardPageTabs = () =>
            Array.from(
                formioRoot.querySelectorAll<HTMLElement>(
                    '.wizard-page-label.badge-info, .wizard-page-label.badge-primary',
                ),
            );

        const getAddPageControls = () =>
            Array.from(formioRoot.querySelectorAll<HTMLElement>('.wizard-page-label.badge-success'));

        // Handle keyboard navigation for wizard tabs
        const handleWizardTabKeydown = (event: KeyboardEvent) => {
            const tabs = getWizardPageTabs();
            const currentTab = event.currentTarget as HTMLElement;
            const currentIndex = tabs.indexOf(currentTab);

            if (currentIndex < 0) return;

            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                pendingFocusIndex = currentIndex;
                currentTab.click();
                return;
            }
            // Find the appropriate next index based on the key pressed
            const lastIndex = tabs.length - 1;
            const nextIndex = (() => {
                if (event.key === 'ArrowRight') {
                    return currentIndex === lastIndex ? 0 : currentIndex + 1;
                }

                if (event.key === 'ArrowLeft') {
                    return currentIndex === 0 ? lastIndex : currentIndex - 1;
                }

                if (event.key === 'Home') {
                    return 0;
                }

                if (event.key === 'End') {
                    return lastIndex;
                }

                return null;
            })();
            // If nextIndex is null, it means the key pressed was
            // not one of the handled keys, so we return early.
            if (nextIndex === null) {
                return;
            }
            // If we have a valid nextIndex, we prevent the default
            // behavior and focus on the next tab.
            event.preventDefault();
            const nextTab = tabs[nextIndex];
            pendingFocusIndex = nextIndex;
            nextTab.focus();
            nextTab.click();
        };
        // Handle keyboard input for the "Add Page" control in the
        // wizard
        const handleAddPageKeydown = (event: KeyboardEvent) => {
            if (event.key !== 'Enter' && event.key !== ' ') {
                return;
            }

            event.preventDefault();
            (event.currentTarget as HTMLElement).click();
        };

        const handleWizardTabClick = (event: MouseEvent) => {
            const tabs = getWizardPageTabs();
            const clickedTab = event.currentTarget as HTMLElement;
            const clickedIndex = tabs.indexOf(clickedTab);

            if (clickedIndex >= 0) {
                pendingFocusIndex = clickedIndex;
            }
        };
        // Apply accessibility attributes to Formio wizard tabs
        // and "Add Page" controls, and manage focus when a tab
        // is clicked or navigated to via keyboard.
        const applyWizardA11yAttributes = () => {
            const tablist = formioRoot.querySelector<HTMLOListElement>('ol.breadcrumb.wizard-pages');
            const wizardTabs = getWizardPageTabs();
            const addPageControls = getAddPageControls();

            if (tablist) {
                tablist.setAttribute('role', 'tablist');
                tablist.setAttribute('aria-label', 'Form pages');
            }

            const selectedTab = wizardTabs.find((tab) => tab.classList.contains('badge-primary'));
            const activeTab = selectedTab ?? wizardTabs[0];

            wizardTabs.forEach((tab, index) => {
                tab.setAttribute('role', 'tab');
                tab.setAttribute('tabindex', tab === activeTab ? '0' : '-1');

                if (!tab.id) {
                    tab.id = `form-builder-wizard-page-${index}`;
                }

                const isSelected = tab.classList.contains('badge-primary');
                tab.setAttribute('aria-selected', String(isSelected));
                tab.onkeydown = handleWizardTabKeydown;
                tab.onclick = handleWizardTabClick;
            });

            addPageControls.forEach((control) => {
                control.setAttribute('tabindex', '0');
                control.setAttribute('role', 'button');
                control.setAttribute('aria-label', 'Add page');
                control.onkeydown = handleAddPageKeydown;
            });

            if (pendingFocusIndex !== null) {
                const tabToFocus = wizardTabs[pendingFocusIndex] ?? activeTab;
                if (tabToFocus) {
                    tabToFocus.focus();
                }
                pendingFocusIndex = null;
            }
        };
        // Add accessibility attributes to other Formio buttons
        // that do not use the <button> element, and ensure that they are
        // focusable and have the correct role.
        const applyButtonA11yAttributes = () => {
            const buttons = getAllButtons();
            buttons.forEach((button) => {
                const handleKeyDown = (event: KeyboardEvent) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        button.click();
                    }
                };
                button.onkeydown = handleKeyDown;
                button.setAttribute('role', 'button');
                button.setAttribute('tabindex', '0');
            });
        };

        applyButtonA11yAttributes();
        applyWizardA11yAttributes();

        const observer = new MutationObserver(() => {
            applyButtonA11yAttributes();
            applyWizardA11yAttributes();
        });

        observer.observe(formioRoot, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => {
            observer.disconnect();
            getWizardPageTabs().forEach((tab) => {
                tab.onkeydown = null;
                tab.onclick = null;
            });
            getAddPageControls().forEach((control) => {
                control.onkeydown = null;
            });
        };
    }, []);

    return (
        <div ref={formioRootRef} className="formio">
            <FormioFormBuilder
                form={savedForm || { display: 'form' }}
                options={{
                    ...formioOptions,
                    ...fileUploadOptions,
                }}
                saveText={'Create Form'}
                onChange={(form: unknown) => handleFormChange(form as FormBuilderData)}
            />
        </div>
    );
};

export default FormBuilder;
