# Technical Design

## Routing and Navigation

- Add `SubscriptionsPage` under `web/src/pages/SubscriptionsPage.tsx`.
- Register `/subscriptions` in `App.tsx`.
- Add a left-sidebar nav item with the `CreditCard` icon.

## Page UX

- Top header with title, short context, and primary add button.
- Stat cards:
  - Total count.
  - Expiring in 30 days.
  - Expired count.
  - Estimated monthly cost.
- Filter chips for all / expiring / expired / normal and type filters.
- Subscription cards with icon, name, provider, price, cycle, expiry date, status, reminder, and description.
- Empty state with add action.
- Modal form for add/edit.
- Confirm dialog for deletion.

## Animation

- Use GSAP for header/stat/card entry.
- Use existing `ConfirmDialog` animation for deletion.
- Form modal uses GSAP scale/fade on mount.

## Data

- Use `subscriptionAPI.list/create/update/delete`.
- Invalidate/refetch through TanStack Query after mutations.
