import React, { Suspense, useState } from 'react';
import { Box, CircularProgress, MenuItem } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faGlobe } from '@fortawesome/pro-regular-svg-icons';
import { Await } from 'react-router';
import { BodyText } from 'components/common/Typography';
import DropdownMenu from 'components/common/Navigation/DropdownMenu';
import { AppConfig } from 'config';
import { Language } from 'models/language';

const defaultLanguage = {
    id: 0,
    name: 'English',
    code: AppConfig.language.defaultLanguageId.toLowerCase(),
    right_to_left: false,
};

const LanguageButtonContent = ({ isOpen, activeLanguageName }: { isOpen: boolean; activeLanguageName: string }) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Box>
                <FontAwesomeIcon
                    icon={faGlobe}
                    style={{
                        color: 'var(--Type-Colours-Primary-Invert, #FFF)',
                        fontSize: '16px',
                        height: '16px',
                    }}
                />
            </Box>
            <Box>
                <BodyText
                    size="small"
                    sx={{
                        color: 'var(--Type-Colours-Primary-Invert, #FFF)',
                        userSelect: 'none',
                        fontSize: '14px',
                        fontStyle: 'normal',
                        fontWeight: 400,
                        lineHeight: '22px',
                        letterSpacing: '0.14px',
                    }}
                >
                    {activeLanguageName}
                </BodyText>
            </Box>
            <Box>
                <FontAwesomeIcon
                    rotation={isOpen ? 180 : undefined}
                    icon={faChevronDown}
                    style={{
                        color: 'var(--Type-Colours-Primary-Invert, #FFF)',
                        fontSize: '16px',
                        height: '16px',
                    }}
                />
            </Box>
        </Box>
    );
};

interface EngagementLanguageSwitcherProps {
    menuName: string;
    translationLanguages?: Promise<Language[]>;
    currentLanguageCode?: string;
    top?: number | string | { xs?: string; md?: string };
    onLanguageSelect: (languageCode: string) => void;
}

export const EngagementLanguageSwitcher = ({
    menuName,
    translationLanguages,
    currentLanguageCode,
    top = 0,
    onLanguageSelect,
}: EngagementLanguageSwitcherProps) => {
    const [targetLanguageCode, setTargetLanguageCode] = useState(currentLanguageCode ?? defaultLanguage.code);
    if (!translationLanguages) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <Await resolve={translationLanguages}>
                {(resolvedLanguages: Language[]) => {
                    const translationOptions = resolvedLanguages
                        .filter((item) => item.code !== defaultLanguage.code)
                        .map((item) => ({ ...item, code: item.code.toLowerCase() }));

                    const languages = [defaultLanguage, ...translationOptions];

                    if (languages.length <= 1) {
                        return null;
                    }

                    const normalizedCurrentLanguageCode = (currentLanguageCode ?? defaultLanguage.code).toLowerCase();
                    const activeLanguage =
                        languages.find((item) => item.code === normalizedCurrentLanguageCode) ?? defaultLanguage;

                    return (
                        <Box
                            sx={{
                                position: 'relative',
                                height: 0,
                                zIndex: 20,
                            }}
                        >
                            <Box
                                sx={{
                                    px: { xs: '16px', md: '5vw', lg: '10em' },
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    position: 'absolute',
                                    top,
                                    left: 0,
                                    right: 0,
                                }}
                            >
                                <DropdownMenu
                                    name={menuName}
                                    renderButtonContent={({ isOpen }) => (
                                        <LanguageButtonContent
                                            isOpen={isOpen}
                                            activeLanguageName={activeLanguage.name}
                                        />
                                    )}
                                    buttonProps={{
                                        sx: {
                                            display: 'flex',
                                            height: '48px',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '0 16px',
                                            borderRadius: '0 0 8px 8px',
                                            background: '#000',
                                            marginTop: 0,
                                            '&:hover': {
                                                background: '#000',
                                            },
                                            '&:focus-visible': {
                                                borderColor: 'common.white',
                                                borderStyle: 'dashed',
                                            },
                                        },
                                    }}
                                    popperProps={{
                                        placement: 'bottom-end',
                                        sx: {
                                            backgroundColor: 'common.white',
                                            color: 'text.primary',
                                        },
                                    }}
                                >
                                    {languages.map((item) => (
                                        <MenuItem
                                            key={item.code}
                                            selected={item.code === activeLanguage.code}
                                            onClick={() => {
                                                if (item.code === activeLanguage.code) {
                                                    return;
                                                }
                                                setTargetLanguageCode(item.code);
                                                onLanguageSelect(item.code);
                                            }}
                                            sx={{
                                                width: '100%',
                                                px: 2,
                                                color: 'text.primary',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            }}
                                        >
                                            {item.name}
                                            {item.code === targetLanguageCode && item.code !== activeLanguage.code && (
                                                <CircularProgress size={16} sx={{ marginLeft: 1 }} />
                                            )}
                                        </MenuItem>
                                    ))}
                                </DropdownMenu>
                            </Box>
                        </Box>
                    );
                }}
            </Await>
        </Suspense>
    );
};

export default EngagementLanguageSwitcher;
