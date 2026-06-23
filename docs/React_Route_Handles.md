## Route Handles in DEP

In our React Router setup, we utilize the `handle` property on route definitions to provide additional metadata that can be used throughout our application. This is particularly useful for features like breadcrumb generation and dynamic document titles.

### Setting up a route handle

When defining a route, you can include a `handle` property that returns an object with a `crumb` function. This function should return an object containing at least a `name` property, which will be used for breadcrumb display and document title generation. You can also include an optional `link` property for breadcrumb navigation and an `isIndex` property to indicate if the route is an index page. You can return a separate `title` property if you want to use a different string inside the document title than the breadcrumb name.

```tsx
{
    handle: {
        crumb: () => ({ name: 'Engagements', title: 'All Engagements', link: getPath(ROUTES.ENGAGEMENT_LISTING)}),
    },
}

// Result:
//   - Page title: "All Engagements | DEP"
//   - Breadcrumb: "Home > Engagements" (clickable link to the listing page)
```

### Using loader data in route handles

If your breadcrumb name needs to be dynamic based on loader data, your crumb function can expect a `data` parameter, which will be the RESOLVED data returned from the route's loader. This allows you to generate breadcrumb names that reflect the specific content being viewed. This data will never be a promise, as it is processed by the page before the crumb function is called.

```tsx
{
    handle: {
        crumb: (data) => ({ name: data?.engagement?.title || 'Engagement Details' }),
    },
}
// Result:
//   - Page title: "<engagement title> | DEP"
//   - Breadcrumb: "Home > Engagements > <engagement title>"
```

### Excluding index pages from document titles

If you want to exclude a route from being included in the document title, you can set the `isIndex` property to `true` in the crumb object. This is useful for routes that serve as index pages for their parent routes, such as a listing page that should not appear in the document title when viewing an individual item.

For example, if you had a page `/products/:productId` that shows details for a specific product, you might have a parent route `/products` that lists all products. You would want the breadcrumb to show "Products > Product Name", but the document title should just be "Product Name". In this case, you would set `isIndex: true` on the crumb for the `/products` route.

```tsx
return (
    <LazyRoute
        path="products"
        handle={{
            allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
            crumb: (data?: { engagement?: { id?: number } }) => ({
                name: 'Products',
                isIndex: true,
            }),
        }}
    >
        <LazyRoute
            index
            ComponentLazy={...}
            handle={{
                crumb: (data) => ({ name: data?.product?.name || 'Product Details' }),
            }}
        />
    </LazyRoute>
)

// Result:
//   - Breadcrumb: "Home > Products > Product Name"
//   - Page title: "Product Name | DEP"
```

### Hooking into the crumb system

If you want to design a component that can leverage the crumb system for consistent breadcrumb and title generation, you can use the `useMatches` hook from React Router to access the current route matches and their associated handles. This allows you to dynamically pull route tree information and generate breadcrumbs or titles based on the current route context.

```tsx
import { useMatches } from "react-router";

const matches = useMatches();
const crumbs = matches
  .map((match) => match.handle?.crumb?.(match.data))
  .filter((crumb) => crumb?.name && !crumb?.isIndex);

// Example of generating a breadcrumb-style path from the current page:
const my_generated_path = crumbs.map((crumb) => crumb.name).join(" > ");
```
