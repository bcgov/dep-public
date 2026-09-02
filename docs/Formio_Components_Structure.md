# Formio Components Structure

This document intends to capture how we work with Formio components in the DEP application. Update this document as needed when new components are added, existing components are modified, or when we make a major change to how we handle Formio components in the application.

## Structure of a Form

Each `Survey` has a `form_json` field that contains the structure of the form. This structure is a JSON object that defines the components of the form, their types, and their properties. At the top level, there are a few important fields:

- `display`: This field defines how the form is displayed. Its value will either be `form` or `wizard`. If the value is `wizard`, the form will be displayed as a multi-step form.
- `components`: This field is an array of components that make up the form. Each component is an object that defines its type, key, label, and other properties. Components can be nested within other components, allowing for complex form structures. If the form is a wizard, the top-level components will be of type `panel`, which represent the "pages" of the wizard. You may wish to handle this case differently when extracting components from the form structure.

## Submissions

The submission structure is stored directly from the Formio submission JSON. The submsision is organized into an object where the keys are the `key` of each component in the form structure, and the values are the user's input for that component. For example, if a form has a text field with the key `firstName`, the submission will have a key `firstName` with the value being whatever the user entered into that field.

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "weatherConditions": {
    "rain": true,
    "snow": false,
    "sunny": true
  }
}
```

## Components

We currently use a combination of:

- Formio's built-in components (https://formio.github.io/formio.js/app/builder)
- CHEFS components (https://github.com/bcgov/common-hosted-form-service/tree/main/components)
- Components from the "met-formio" package (https://www.npmjs.com/package/met-formio)

### Example Form Structures

```
{
  "display": "form",
  "components": [
    {
      "type": "textfield",
      "key": "firstName",
      "label": "First Name"
      ...
    },
    {
      "type": "well",
        "components": [
          {
            "type": "simplefile",
            "key": "fileUpload",
            "label": "Upload a file"
            ...
          }
        ]
    },
    ...
  ]
}


{
    "display": "wizard",
    "components": [
        {
            "type": "panel",
            "key": "page1",
            "components": [
                {
                    "type": "textfield",
                    "key": "firstName",
                    "label": "First Name"
                },
                {
                    "type": "textfield",
                    "key": "lastName",
                    "label": "Last Name"
                }
            ]
        },
        {
            "type": "panel",
            "key": "page2",
            "components": [
                {
                    "type": "email",
                    "key": "email",
                    "label": "Email"
                }
            ]
        }
    ]
}
```

### Example Submission Structures

### Component List

This list will be organized using the same structure and categories as the in-app survey builder.

#### Basic Layout

- **Text/Images**
  Type: `simplecontent`
  Input: `false`

- **Columns - 2**
  Type: `simplecols2`
  Input: `false`

- **Columns - 3**
  Type: `simplecols3`
  Input: `false`

- **Columns - 4**
  Type: `simplecols4`
  Input: `false`

- **Tabs**
  Type: `simpletabs`
  Input: `false`

- **Panel**
  Type: `simplepanel`
  Input: `false`

#### Basic Fields

- **Text Field**
  Type: `simpletextfield`
  Input: `true`
  Input Type: `text`

- **Multi-line Text**
  Type: `simpletextarea`
  Input: `true`
  Input Type: `text`

- **Select List**
  Type: `simpleselect`
  Input: `true`
  Input Type: `undefined`
  Data Type: `auto`

- **Checkbox**
  Type: `simplecheckbox`
  Input: `true`
  Input Type: `checkbox`

- **Checkbox Group**
  Type: `simplecheckboxes`
  Input: `true`
  Input Type: `checkbox`

- **Radio Group**
  Type: `simpleradios`
  Input: `true`
  Input Type: `radio`

- **Number**
  Type: `simplenumber`
  Input: `true`
  Input Type: `undefined`

- **Phone Number**
  Type: `simplephonenumber`
  Input: `true`
  Input Type: `tel`

- **Email**
  Type: `simpleemail`
  Input: `true`
  Input Type: `email`

- **Date / Time**
  Type: `simpledatetime`
  Input: `true`
  Input Type: `undefined`

- **Day**
  Type: `simpleday`
  Input: `true`
  Input Type: `undefined`

- **Postal Code**
  Type: `simplepostalcode`
  Input: `true`
  Input Type: `postalcode`

#### Advanced Layout

- **HTML Element**
  Type: `htmlelement`
  Input: `false`

- **Content**
  Type: `content`
  Input: `false`

- **Columns**
  Type: `columns`
  Input: `false`

- **Panel**
  Type: `panel`
  Input: `false`

- **Table**
  Type: `table`
  Input: `false`

- **Tabs**
  Type: `tabs`
  Input: `false`

- **Well**
  Type: `well`
  Input: `false`

#### Advanced Fields

- **Text Field**
  Type: `simpletextfieldadvanced`
  Input: `true`
  Input Type: `text`

- **Email**
  Type: `simpleemailadvanced`
  Input: `true`
  Input Type: `email`

- **Text Area**
  Type: `simpletextareaadvanced`
  Input: `true`
  Input Type: `text`

- **URL**
  Type: `simpleurladvanced`
  Input: `true`
  Input Type: `url`

- **Number**
  Type: `simplenumberadvanced`
  Input: `true`
  Input Type: `undefined`

- **Phone Number**
  Type: `simplephonenumberadvanced`
  Input: `true`
  Input Type: `tel`

- **Tags**
  Type: `simpletagsadvanced`
  Input: `true`
  Input Type: `undefined`

- **Address**
  Type: `simpleaddressadvanced`
  Input: `true`
  Input Type: `undefined`

- **Password**
  Type: `simplepasswordadvanced`
  Input: `true`
  Input Type: `password`

- **Date / Time**
  Type: `simpledatetimeadvanced`
  Input: `true`
  Input Type: `undefined`

- **Checkbox**
  Type: `simplecheckboxadvanced`
  Input: `true`
  Input Type: `checkbox`

- **Day**
  Type: `simpledayadvanced`
  Input: `true`
  Input Type: `undefined`

- **Time**
  Type: `simpletimeadvanced`
  Input: `true`
  Input Type: `time`

- **Select Boxes**
  Type: `simpleselectboxesadvanced`
  Input: `true`
  Input Type: `checkbox`

- **Select**
  Type: `simpleselectadvanced`
  Input: `true`
  Input Type: `undefined`

- **Currency**
  Type: `simplecurrencyadvanced`
  Input: `true`
  Input Type: `undefined`

- **Radio**
  Type: `simpleradioadvanced`
  Input: `true`
  Input Type: `radio`

- **Button**
  Type: `simplebuttonadvanced`
  Input: `true`
  Input Type: `undefined`

- **Survey**
  Type: `simplesurveyadvanced`
  Input: `true`
  Input Type: `undefined`

- **Signature**
  Type: `simplesignatureadvanced`
  Input: `true`
  Input Type: `undefined`

#### Advanced Data

- **Hidden**
  Type: `hidden`
  Input: `true`
  Input Type: `hidden`

- **Container**
  Type: `container`
  Input: `true`
  Input Type: `undefined`

- **Data Map**
  Type: `datamap`
  Input: `true`
  Input Type: `undefined`
  Value Component: (any component)

- **Data Grid**
  Type: `datagrid`
  Input: `true`
  Input Type: `undefined`
  Components: (array of components)
  Value shape: Object with keys corresponding to the `key` of each component in the `components` array.

- **Edit Grid**
  Type: `editgrid`
  Input: `true`
  Input Type: `undefined`
  Components: (array of components)
  Value shape: Array of objects, each with keys corresponding to the `key` of each component in the `components` array.

#### BC Government

- **File Upload**
  Type: `simplefile`
  Input: `true`
  Input Type: `undefined`

- **Business Name Search**
  Type: `orgbook`
  Input: `true`
  Input Type: `undefined`
  Data Type: `string`

- **Map**
  Type: `map`
  Input: `true`
  Input Type: `undefined`
  Value shape:

  ```json
  {
    "features": [
        "type": "marker",
        "coordinates": {
            "lat": float,
            "lng": float
        }
    ]
  }
  ```

- **BC Address**
  Type: `bcaddress`
  Input: `true`
  Input Type: `undefined`
  Value shape:
  ```json
  {
    "addressLine1": string,
    "addressLine2": string,
    "city": string,
    "province": string,
    "postalCode": string,
    "country": string
  }
  ```
