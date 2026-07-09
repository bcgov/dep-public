import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useBlocker, useParams, useRevalidator, useLoaderData } from 'react-router';
import { Box, Modal } from '@mui/material';
import PreviewControlBar from './PreviewControlBar';
import PreviewContent from './PreviewContent';
import { SubmissionStatusTypes } from './PreviewStateTabs';
import { checkEngagementCompleteness } from './utils/checkCompleteness';
import { Engagement } from 'models/engagement';
import { EngagementLoaderPublicData } from '../public/view/EngagementLoaderPublic';
import { SubmissionStatus } from 'constants/engagementStatus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faGlobePointer } from '@fortawesome/pro-regular-svg-icons';
import { PreviewLoaderDataProvider } from './PreviewLoaderDataContext';
import PublicHeader from 'components/layout/Header/PublicHeader';
import ConfirmModal from 'components/common/Modals/ConfirmModal';

interface PreviewNavigationGuardProps {
    previewPathPrefix: string;
}

const PreviewNavigationGuard: React.FC<PreviewNavigationGuardProps> = ({ previewPathPrefix }) => {
    const [blockedDestinationHref, setBlockedDestinationHref] = useState<string | null>(null);
    const previewBlocker = useBlocker(({ currentLocation, nextLocation }) => {
        const leavingPreview = !nextLocation.pathname.startsWith(previewPathPrefix);
        const pathChanged =
            nextLocation.pathname !== currentLocation.pathname ||
            nextLocation.search !== currentLocation.search ||
            nextLocation.hash !== currentLocation.hash;

        if (leavingPreview && pathChanged) {
            const nextHref = `${nextLocation.pathname}${nextLocation.search}${nextLocation.hash}`;
            setBlockedDestinationHref((previousHref) => (previousHref === nextHref ? previousHref : nextHref));
            return true;
        }

        return false;
    });

    const blockedLocationHref = previewBlocker.location
        ? `${previewBlocker.location.pathname}${previewBlocker.location.search}${previewBlocker.location.hash}`
        : null;

    const closeBlockedNavigationModal = () => {
        if (previewBlocker.state === 'blocked') {
            previewBlocker.reset();
        }
        setBlockedDestinationHref(null);
    };

    const handleOpenBlockedDestinationInNewTab = () => {
        const destinationHref = blockedDestinationHref ?? blockedLocationHref;
        if (!destinationHref) {
            return;
        }

        globalThis.open(destinationHref, '_blank', 'noopener,noreferrer');
        closeBlockedNavigationModal();
    };

    return (
        <Modal
            open={Boolean(blockedDestinationHref)}
            onClose={(_event) => {
                closeBlockedNavigationModal();
            }}
        >
            <ConfirmModal
                style="warning"
                header="Open Outside of Preview?"
                icon={faGlobePointer}
                subHeader="This link can't be opened in the current preview tab."
                subText={[
                    {
                        text: 'To ensure this preview works correctly, links to other pages must be opened in a new tab.',
                    },
                ]}
                cancelButtonText="Back to Preview"
                confirmButtonText="Open in New Tab"
                handleClose={closeBlockedNavigationModal}
                handleConfirm={handleOpenBlockedDestinationInNewTab}
            />
        </Modal>
    );
};

const MeasurementBar: React.FC = () => {
    const [viewportWidth, setViewportWidth] = useState(globalThis.innerWidth);
    const [barVisible, setBarVisible] = useState(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handleResize = () => {
            setViewportWidth(globalThis.innerWidth);
            setBarVisible(true);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            hideTimerRef.current = setTimeout(() => setBarVisible(false), 1500);
        };
        globalThis.addEventListener('resize', handleResize);
        return () => {
            globalThis.removeEventListener('resize', handleResize);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    return (
        <Box
            sx={{
                position: 'fixed',
                top: '50%',
                transform: 'translateY(-50%)',
                left: 0,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                boxSizing: 'border-box',
                userSelect: 'none',
                pointerEvents: 'none',
                color: (theme) => theme.palette.error.main,
                borderTop: (theme) => `1px solid color-mix(in srgb, ${theme.palette.error.dark}, transparent 80%)`,
                borderBottom: (theme) => `1px solid color-mix(in srgb, ${theme.palette.error.dark}, transparent 80%)`,
                backgroundColor: (theme) => `color-mix(in srgb, ${theme.palette.error.dark}, transparent 80%)`,
                backdropFilter: 'blur(2px)',
                opacity: barVisible ? 1 : 0,
                transition: 'opacity 0.5s ease',
                zIndex: 9999,
            }}
        >
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '24px',
                    gap: 1,
                }}
            >
                <FontAwesomeIcon icon={faArrowLeft} />
                <Box
                    sx={{
                        flex: 1,
                        height: '2px',
                        backgroundImage:
                            'repeating-linear-gradient(to right, currentColor, currentColor 8px, transparent 8px, transparent 16px)',
                    }}
                />
            </Box>
            <Box
                sx={{
                    padding: '3px 16px',
                    backgroundColor: (theme) => theme.palette.error.main,
                    color: (theme) => theme.palette.error.contrastText,
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                }}
            >
                {viewportWidth}px
            </Box>
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '24px',
                    gap: 1,
                }}
            >
                <Box
                    sx={{
                        flex: 1,
                        height: '2px',
                        backgroundImage:
                            'repeating-linear-gradient(to left, currentColor, currentColor 8px, transparent 8px, transparent 16px)',
                    }}
                />
                <FontAwesomeIcon icon={faArrowRight} />
            </Box>
        </Box>
    );
};

/**
 * Preview page for viewing engagement in different states before publishing.
 * Allows switching between Upcoming/Open/Closed/Results Published states without
 * modifying the actual engagement.
 */
export const EngagementPreview: React.FC = () => {
    const loaderData = useLoaderData() as EngagementLoaderPublicData;
    const { engagement, widgets, details, metadata, suggestions } = loaderData ?? {};
    const { engagementId, languageCode } = useParams();
    const revalidator = useRevalidator();
    const [previewState, setPreviewState] = useState<SubmissionStatusTypes>('Upcoming');
    const [isReloading, setIsReloading] = useState(false);
    const [contentVersion, setContentVersion] = useState(0);
    const [resolvedEngagement, setResolvedEngagement] = useState<Engagement | null>(null);

    const previewPathPrefix = `/manage/engagements/${engagementId ?? ''}/preview`;

    const getPreviewStateFromEngagement = (engagement: Engagement): SubmissionStatusTypes => {
        switch (engagement.submission_status) {
            case SubmissionStatus.Open:
                return 'Open';
            case SubmissionStatus.Upcoming:
                return 'Upcoming';
            case SubmissionStatus.Closed: {
                const viewResultsBlock = engagement.status_block?.find(
                    (block) => block.survey_status === 'ViewResults',
                );
                const hasViewResultsContent = Boolean(
                    viewResultsBlock?.button_text?.trim() ||
                    viewResultsBlock?.block_text?.trim() ||
                    viewResultsBlock?.internal_link?.trim() ||
                    viewResultsBlock?.external_link?.trim(),
                );
                return hasViewResultsContent ? 'ViewResults' : 'Closed';
            }
            default:
                return 'Upcoming';
        }
    };

    // Convert preview state to submission status ID
    const getSubmissionStatusId = (state: SubmissionStatusTypes): SubmissionStatus => {
        switch (state) {
            case 'Upcoming':
                return SubmissionStatus.Upcoming;
            case 'Open':
                return SubmissionStatus.Open;
            case 'Closed':
                return SubmissionStatus.Closed;
            case 'ViewResults':
                return SubmissionStatus.Closed; // ViewResults uses Closed status with different blocks
            default:
                return SubmissionStatus.Upcoming;
        }
    };

    const handleReload = () => {
        if (isReloading) return;
        setIsReloading(true);
        revalidator.revalidate();
    };

    useEffect(() => {
        setContentVersion((previous) => previous + 1);
    }, [engagement, widgets, details, metadata, suggestions]);

    useEffect(() => {
        let isMounted = true;

        engagement
            .then((engagement) => {
                if (!isMounted) return;
                setResolvedEngagement(engagement);
                setPreviewState(getPreviewStateFromEngagement(engagement));
            })
            .catch(() => {
                return;
            });

        return () => {
            isMounted = false;
        };
    }, [engagement]);

    useEffect(() => {
        if (!isReloading) return;

        let isMounted = true;
        Promise.allSettled([engagement, widgets, details, metadata, suggestions]).finally(() => {
            if (isMounted) {
                setIsReloading(false);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [isReloading, engagement, widgets, details, metadata, suggestions]);

    useEffect(() => {
        const animateScrollToElement = (targetId: string) => {
            const targetElement = document.getElementById(targetId);
            if (!targetElement) return;

            const startY = globalThis.scrollY;
            const targetY = targetElement.getBoundingClientRect().top + globalThis.scrollY;
            const distanceY = targetY - startY;
            const durationMs = 260;
            const startTime = performance.now();

            if (Math.abs(distanceY) < 2) {
                try {
                    globalThis.history.replaceState(null, '', `#${targetId}`);
                } catch {
                    return;
                }
                return;
            }

            const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3);

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / durationMs, 1);
                const easedProgress = easeOutCubic(progress);
                globalThis.scrollTo(0, Math.round(startY + distanceY * easedProgress));

                if (progress < 1) {
                    globalThis.requestAnimationFrame(animate);
                    return;
                }

                try {
                    globalThis.history.replaceState(null, '', `#${targetId}`);
                } catch {
                    return;
                }
            };

            globalThis.requestAnimationFrame(animate);
        };

        const handleWindowMessage = (event: MessageEvent) => {
            if (event.origin !== globalThis.location.origin) return;

            const message = event?.data || undefined;
            if (message?.type === 'preview-scroll') {
                animateScrollToElement(event?.data?.targetId);
            } else if (message?.type === 'preview-refresh') {
                handleReload();
            }
        };

        globalThis.addEventListener('message', handleWindowMessage);

        const scrollToHashTarget = () => {
            const targetId = globalThis.location.hash.replace('#', '');
            if (!targetId) return;
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        const firstAttempt = globalThis.setTimeout(scrollToHashTarget, 60);
        const secondAttempt = globalThis.setTimeout(scrollToHashTarget, 220);
        const thirdAttempt = globalThis.setTimeout(scrollToHashTarget, 500);

        globalThis.addEventListener('hashchange', scrollToHashTarget);
        return () => {
            globalThis.clearTimeout(firstAttempt);
            globalThis.clearTimeout(secondAttempt);
            globalThis.clearTimeout(thirdAttempt);
            globalThis.removeEventListener('hashchange', scrollToHashTarget);
            globalThis.removeEventListener('message', handleWindowMessage);
        };
    }, [contentVersion]);

    const isComplete = resolvedEngagement ? checkEngagementCompleteness(resolvedEngagement) : false;

    const previewLoaderData: EngagementLoaderPublicData = useMemo(
        () => ({
            ...loaderData,
            engagement: resolvedEngagement
                ? Promise.resolve({
                      ...resolvedEngagement,
                      submission_status: getSubmissionStatusId(previewState),
                  })
                : engagement,
        }),
        [loaderData, resolvedEngagement, previewState],
    );

    const previewContentKey = `${engagementId ?? 'engagement'}-${languageCode ?? 'language'}-${contentVersion}`;

    return (
        <PreviewLoaderDataProvider loaderData={previewLoaderData}>
            <PreviewNavigationGuard previewPathPrefix={previewPathPrefix} />
            <PreviewControlBar
                engagement={resolvedEngagement ?? undefined}
                previewState={previewState}
                onStateChange={setPreviewState}
                onReload={handleReload}
                isReloading={isReloading}
                isComplete={isComplete}
            />
            <PublicHeader />
            <PreviewContent key={previewContentKey} previewStateType={previewState} />
            <MeasurementBar />
        </PreviewLoaderDataProvider>
    );
};

export default EngagementPreview;
