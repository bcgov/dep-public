export const formioOptions = {
    noDefaultSubmitButton: true,
    builder: {
        //change to true to show advanced components section
        premium: false,
        basic: false,

        layoutControls: {
            title: 'Basic Layout',
            default: true,
            weight: 10,
            components: {
                simplecols2: true,
                simplecols3: true,
                simplecols4: true,
                simplecontent: true,
                simplefieldset: false,
                simpleheading: false,
                simplepanel: true,
                simpleparagraph: false,
                simpletabs: true,
            },
        },
        entryControls: {
            title: 'Basic Fields',
            weight: 20,
            components: {
                simplecheckbox: true,
                simplecheckboxes: true,
                simpledatetime: true,
                simpleday: true,
                simpleemail: true,
                simplenumber: true,
                simplephonenumber: true,
                simpleradios: true,
                simpleselect: true,
                simpletextarea: true,
                simpletextfield: true,
                simplepostalcode: true,
                simpletime: false,
            },
        },
        layout: {
            title: 'Advanced Layout',
            weight: 30,
        },
        advanced: {
            title: 'Advanced Fields',
            weight: 40,
            components: {
                // Remove default Formio advanced components to prevent duplicates
                email: false,
                url: false,
                phoneNumber: false,
                tags: false,
                address: false,
                datetime: false,
                day: false,
                time: false,
                currency: false,
                survey: false,
                signature: false,
                // Prevent duplicate appearance of orgbook component
                orgbook: false,
                bcaddress: false,
                simplebcaddress: false,
            },
        },
        data: {
            title: 'Advanced Data',
            weight: 50,
        },
        customControls: {
            title: 'BC Government',
            weight: 60,
            components: {
                simplefile: true,
                orgbook: true,
                bcaddress: true,
                simplebcaddress: true,
                map: true,
                idirusers: false,
            },
        },
    },
};
