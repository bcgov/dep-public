import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(tz);

export const convertToPacific = (date: string) => {
    return dayjs.utc(date).tz('America/Vancouver');
};

export const convertToUTC = (date: string) => {
    return dayjs(date).utc();
};

export const formatToPacific = (date: Dayjs | string, formatString = 'YYYY-MM-DD HH:mm:ss') => {
    if (date) {
        const pacificDate = convertToPacific(date.toString());
        return pacificDate.format(formatString);
    } else {
        return '';
    }
};

export const formatToUTC = (date: Dayjs | string, formatString = 'YYYY-MM-DD HH:mm:ss') => {
    if (date) {
        const utcDate = convertToUTC(date.toString());
        return utcDate.format(formatString);
    } else {
        return '';
    }
};

export const formatRelative = (date: Dayjs | string) => {
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 },
    ];

    const now = convertToPacific(dayjs().toString());
    const targetDate = convertToPacific(date.toString());
    const secondsElapsed = now.diff(targetDate, 'second');
    const isFuture = secondsElapsed < 0;

    const absSecondsElapsed = Math.abs(secondsElapsed);

    for (const interval of intervals) {
        const count = Math.floor(absSecondsElapsed / interval.seconds);
        const pluralS = count > 1 ? 's' : '';
        if (count >= 1) {
            return isFuture ? `in ${count} ${interval.label}${pluralS}` : `${count} ${interval.label}${pluralS} ago`;
        }
    }

    return 'just now';
};
