export const formioOptions = {
    noDefaultSubmitButton: true,
    builder: {
        //change to true to show advanced components section
        advanced: false,
        data: false,
        premium: false,
        basic: false,
        layout: false,
        custom: {
            title: '',
            weight: 20,
            components: {
                // "MET-Formio" components
                // simpletextfield: true, // overridden by BC Gov formio components
                // simpletextarea: true, // overridden
                // simpleradios: true, // overridden
                simplecheckboxes: true,
                header: false, // redundant
                paragraph: false, // redundant
                simplepostalcode: true,
                // hiding category checkboxes
                categorycheckboxes: false,
                // hiding category comment container
                categorycommentcontainer: false,
                simplehtmlelement: true,
                simplecontent: true,
                simplesurvey: true,
                // simpleselect: true, // overridden

                // BC Gov formio components
                orgbook: true,
                simplebtnreset: true,
                simplebtnsubmit: true,
                simplecheckbox: true,
                simplecols2: true,
                simplecols3: true,
                simplecols4: true,
                simpledatetime: true,
                simpleday: true,
                simpleemail: true,
                simplefieldset: true,
                simplefile: true,
                simpleheading: true,
                simplenumber: true,
                simplepanel: true,
                simpleparagraph: true,
                simplephonenumber: true,
                simpleradios: true,
                simpleselect: true,
                simpletabs: true,
                simpletextarea: true,
                simpletextfield: true,
                simpletime: true,
                simpletextfieldadvanced: true,
                simpleemailadvanced: true,
                simpletextareaadvanced: true,
                simplenumberadvanced: true,
                simpleurladvanced: true,
                simplephonenumberadvanced: true,
                simpletagsadvanced: true,
                simpleaddressadvanced: true,
                simplepasswordadvanced: true,
                simpledatetimeadvanced: true,
                simplecheckboxadvanced: true,
                simpledayadvanced: true,
                simpletimeadvanced: true,
                simpleselectboxesadvanced: true,
                simpleselectadvanced: true,
                simplecurrencyadvanced: true,
                simpleradioadvanced: true,
                simplesurveyadvanced: true,
                simplesignatureadvanced: true,
                simplebuttonadvanced: true,
                bcaddress: true,
                simplebcaddress: true,
                map: true,
                idirusers: false,
            },
            default: true,
        },
    },
};
