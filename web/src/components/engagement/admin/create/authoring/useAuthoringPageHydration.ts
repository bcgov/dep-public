import { DependencyList, Dispatch, SetStateAction, useEffect, useState } from 'react';

interface UseAuthoringPageHydrationParams<TFormValues> {
    deps: DependencyList;
    fetcherData: unknown;
    getValues: () => TFormValues;
    loadValues: () => Promise<TFormValues>;
    reset: (values: TFormValues) => void;
    setDefaultValues: Dispatch<SetStateAction<TFormValues>>;
}

export const useAuthoringPageHydration = <TFormValues>({
    deps,
    fetcherData,
    getValues,
    loadValues,
    reset,
    setDefaultValues,
}: UseAuthoringPageHydrationParams<TFormValues>) => {
    const [isHydrating, setIsHydrating] = useState(false);

    useEffect(() => {
        if (typeof fetcherData !== 'string' || fetcherData !== 'success') {
            return;
        }

        const newDefaults = getValues();
        setDefaultValues(newDefaults);
        reset(newDefaults);
    }, [fetcherData, getValues, reset, setDefaultValues]);

    useEffect(() => {
        let isActive = true;

        const hydrate = async () => {
            setIsHydrating(true);

            try {
                const values = await loadValues();

                if (!isActive) {
                    return;
                }

                reset(values);
                setDefaultValues(values);
            } finally {
                if (isActive) {
                    setIsHydrating(false);
                }
            }
        };

        void hydrate();

        return () => {
            isActive = false;
        };
    }, [loadValues, reset, setDefaultValues, ...deps]);

    return { isHydrating };
};
