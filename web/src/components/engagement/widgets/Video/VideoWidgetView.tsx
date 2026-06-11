import React, { useEffect, useState } from 'react';
import { colors } from 'components/common';
import { BodyText, Heading2, Heading3 } from 'components/common/Typography';
import { Grid2 as Grid, Skeleton } from '@mui/material';
import { Widget } from 'models/widget';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { VideoWidget } from 'models/videoWidget';
import { fetchVideoWidgets } from 'services/widgetService/VideoService';
import ReactPlayer from 'react-player';
import { When } from 'react-if';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faVimeo,
    faYoutube,
    faSoundcloud,
    faFacebookF,
    faTwitch,
    faMixcloud,
    faDailymotion,
} from '@fortawesome/free-brands-svg-icons';
import { faQuestionCircle, IconDefinition } from '@fortawesome/free-solid-svg-icons';

interface VideoWidgetProps {
    widget: Widget;
}

interface WidgetVideoSource {
    domain: string;
    name: string;
    icon: IconDefinition;
}

interface VideoOverlayProps {
    videoOverlayTitle: string;
    source: string;
    videoSources: WidgetVideoSource[];
}

const VideoWidgetView = ({ widget }: VideoWidgetProps) => {
    const dispatch = useAppDispatch();

    const [videoWidget, setVideoWidget] = useState<VideoWidget | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [videoDuration, setVideoDuration] = useState('');
    const [showOverlay, setShowOverlay] = useState(true);
    const [videoOverlayTitle, setVideoOverlayTitle] = useState('');

    const playerConfig = {
        youtube: {
            playerVars: {
                origin: globalThis.location.origin,
            },
        },
    };

    const fetchVideo = async () => {
        try {
            const videos = await fetchVideoWidgets(widget.id);
            const video = videos[videos.length - 1];
            setVideoWidget(video);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            console.log(error);
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Error occurred while fetching Engagement widgets information',
                }),
            );
        }
    };

    useEffect(() => {
        fetchVideo();
    }, [widget]);

    if (isLoading) {
        return (
            <Grid container size={12} justifyContent="flex-start" spacing={3}>
                <Grid size={12}>
                    <Heading2>
                        <Skeleton variant="rectangular" />
                    </Heading2>
                </Grid>
                <Grid size={12}>
                    <Skeleton variant="rectangular" height="20em" />
                </Grid>
            </Grid>
        );
    }

    if (!videoWidget) {
        return null;
    }

    const localizedVideoUrl = widget.video_url ?? videoWidget.video_url;
    const localizedVideoDescription = widget.video_description ?? videoWidget.description;

    const formatVideoDuration = (duration: number) => {
        let minutes = 0;
        let hours = 0;
        let seconds = 0;
        if (3600 < duration) {
            hours = Math.floor(duration / 3600);
            minutes = Math.floor((duration - hours * 3600) / 60);
            seconds = Math.floor(duration - hours * 3600 - minutes * 60);
            return `${hours} hr ${minutes} min ${seconds} sec`;
        } else if (3600 > duration && 60 < duration) {
            minutes = Math.floor(duration / 60);
            seconds = Math.floor(duration - minutes * 60);
            return `${minutes} min ${seconds} sec`;
        } else if (60 > duration && 0 < duration) {
            return `${seconds} seconds`;
        } else {
            return '';
        }
    };

    const videoSources: WidgetVideoSource[] = [
        { domain: 'youtu.be', name: 'YouTube', icon: faYoutube },
        { domain: 'youtube.com', name: 'YouTube', icon: faYoutube },
        { domain: 'vimeo.com', name: 'Vimeo', icon: faVimeo },
        { domain: 'twitch.tv', name: 'Twitch', icon: faTwitch },
        { domain: 'soundcloud.com', name: 'SoundCloud', icon: faSoundcloud },
        { domain: 'mixcloud.com', name: 'Mixcloud', icon: faMixcloud },
        { domain: 'dailymotion.com', name: 'DailyMotion', icon: faDailymotion },
        { domain: 'facebook.com', name: 'Facebook', icon: faFacebookF },
    ];

    const hostname = new URL(localizedVideoUrl).hostname;
    const videoSource = videoSources.find((source) => hostname.includes(source.domain))?.name || 'Unknown';

    const getVideoTitle = (player: ReactPlayer, source: string, widgetTitle: string) => {
        if ('YouTube' === source) {
            return `${player.getInternalPlayer().videoTitle} (${source} video)`;
        } else if ('Vimeo' === source) {
            return `${player.getInternalPlayer().element.title} (${source} video)`;
        } else if ('Facebook' === source || 'Twitch' === source || 'DailyMotion' === source) {
            return `${widgetTitle} (${source} video)`; // API doesn't return video title, use widget title.
        } else if ('SoundCloud' === source || 'Mixcloud' === source) {
            return `${widgetTitle} (${source} audio)`; // API doesn't return audio title, use widget title.
        } else {
            return `${widgetTitle} (video)`;
        }
    };

    return (
        <Grid container size={12} justifyContent={{ xs: 'center' }} alignItems="center" rowSpacing={2}>
            <Grid size={12} sx={{ height: widget.title.length ? 'auto' : '0px' }}>
                <Heading3 fontWeight="lighter" fontSize="1.5rem">
                    {widget.title}
                </Heading3>
            </Grid>
            <Grid size={12}>
                <BodyText mb="1.5rem">{localizedVideoDescription}</BodyText>
            </Grid>
            <Grid size={12} container pt={0} mt={0} spacing={0} position="relative">
                <When condition={showOverlay && 'Mixcloud' !== videoSource}>
                    <VideoOverlay
                        videoOverlayTitle={videoOverlayTitle}
                        source={videoSource}
                        videoSources={videoSources}
                    />
                </When>
                <Grid
                    borderRadius="16px"
                    overflow="hidden"
                    position="relative"
                    size={12}
                    paddingTop="56.25%"
                    height="100%"
                    bgcolor="black"
                >
                    {/* Overlay covers play button for Mixcloud so it shouldn't be displayed */}
                    <ReactPlayer
                        onDuration={(duration) => {
                            setVideoDuration(formatVideoDuration(duration));
                        }}
                        url={localizedVideoUrl}
                        controls
                        onReady={(player) => {
                            setVideoOverlayTitle(getVideoTitle(player, videoSource, widget.title));
                        }}
                        onPlay={() => setShowOverlay(false)}
                        width="100%"
                        height={'100%'}
                        config={playerConfig}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                        }}
                    />
                </Grid>
            </Grid>
            <Grid size={12} pt="0.5rem">
                <BodyText>{videoDuration}</BodyText>
            </Grid>
        </Grid>
    );
};

const VideoOverlay = ({ videoOverlayTitle, source, videoSources }: VideoOverlayProps) => {
    return (
        <Grid
            container
            size={12}
            height="0"
            overflow="visible"
            position="absolute"
            top={0}
            left={0}
            justifyContent="center"
            alignItems="center"
        >
            <Grid
                container
                size={12}
                borderRadius="16px 16px 0 0"
                zIndex="10000"
                padding="0.65rem 1rem"
                bgcolor="black"
            >
                <Grid container alignItems="center" size={12} color={colors.surface.white}>
                    <BodyText size="small" textOverflow="ellipsis" whiteSpace="nowrap" overflow="hidden" width="100%">
                        <FontAwesomeIcon
                            icon={videoSources.find((vs) => vs.name === source)?.icon || faQuestionCircle}
                            style={{
                                fontSize: '1.9rem',
                                paddingRight: '0.65rem',
                                color: colors.surface.white,
                                verticalAlign: 'middle',
                            }}
                        />
                        {videoOverlayTitle}
                    </BodyText>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default VideoWidgetView;
