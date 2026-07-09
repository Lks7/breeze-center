# 订阅中心体验优化

## Goal

Turn subscriptions into a first-class center reachable from the left sidebar, with a polished page for reviewing, adding, editing, and deleting subscriptions.

## Requirements

- Add a subscription entry to the left public sidebar.
- Add a public `/subscriptions` route.
- The subscription center must show key stats: total subscriptions, monthly estimate, expiring soon, expired.
- The page must list subscriptions with clear status, provider, price, cycle, reminder days, and description.
- Users must be able to add subscriptions from the subscription center.
- Users must be able to edit existing subscriptions from the subscription center.
- Users must be able to delete subscriptions from the subscription center with confirmation.
- The page should use GSAP animation for a more lively but restrained experience.
- Keep using the existing subscription API.

## Acceptance Criteria

- [ ] Sidebar includes a "订阅" navigation item.
- [ ] `/subscriptions` renders a usable subscription center.
- [ ] Add, edit, and delete flows work from the page.
- [ ] Deletion requires confirmation.
- [ ] Subscription cards show status and expiry information.
- [ ] GSAP animations are used for page/card/modal transitions.
- [ ] Frontend typecheck/build passes.

## Notes

- This is a frontend-focused improvement; backend API already exists.
