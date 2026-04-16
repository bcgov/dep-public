import { createContext, useContext } from 'react';
import { AuthoringContextType } from './types';

export const AuthoringFormContext = createContext<AuthoringContextType | undefined>(undefined);

export const useAuthoringFormContext = () => {
    const context = useContext(AuthoringFormContext);

    if (!context) {
        throw new Error('useAuthoringFormContext must be used within an AuthoringFormContext provider');
    }

    return context;
};
