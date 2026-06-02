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
