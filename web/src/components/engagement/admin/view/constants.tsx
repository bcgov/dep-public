import dayjs from 'dayjs';

export const selectDataTypes = ['text', 'number', 'url', 'email', 'phone'];
export const dateTimeTypes = ['date', 'time', 'datetime'];
export const filterValues = ['', 'None'];

export const metadataTypes = [
    {
        db_name: 'text', // Stored data type in db
        readable_name: 'text', // Displayed to user
        data_type: 'string', // Real form data type
        isSelectable: true, // Appropriate for a select box
        isSubstance: true, // Substance or item, affects phrasing
        default: ['None'],
    },
    {
        db_name: 'long_text',
        readable_name: 'long text',
        data_type: 'string',
        isSelectable: false,
        isSubstance: true,
        default: '',
    },
    {
        db_name: 'number',
        readable_name: 'number',
        data_type: 'string', // Functionally, it is a string in the form
        isSelectable: true,
        isSubstance: false,
        default: ['None'],
    },
    {
        db_name: 'url',
        readable_name: 'website',
        data_type: 'string',
        isSelectable: true,
        isSubstance: false,
        default: ['None'],
    },
    {
        db_name: 'phone',
        readable_name: 'phone number',
        data_type: 'string',
        isSelectable: true,
        isSubstance: false,
        default: ['None'],
    },
    {
        db_name: 'date',
        readable_name: 'date',
        data_type: 'string',
        isSelectable: false,
        isSubstance: false,
        default: dayjs().format('YYYY-MM-DD'),
    },
    {
        db_name: 'time',
        readable_name: 'time',
        data_type: 'string',
        isSelectable: false,
        isSubstance: false,
        default: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    },
    {
        db_name: 'datetime',
        readable_name: 'date and time',
        data_type: 'string',
        isSelectable: false,
        isSubstance: false,
        default: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    },
    {
        db_name: 'boolean',
        readable_name: 'true or false',
        data_type: 'boolean',
        isSelectable: false,
        isSubstance: true,
        default: 'false',
    },
];
