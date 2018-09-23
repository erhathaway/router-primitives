# recursive-router
Simple, expressive, mobx-based routing state management. Routers all the way down

## What makes this routing library different?

#### Platform independent

This library only controls the routeable state, not the logic that renders components, elements, etc...

This ensures platform independence and easy reuse of routing configuration across platform specific apps. For example, you can share the same routing configuration between a React app and it's sibling React Native app.

#### State as a function of URL

The routeable state is a state tree that maps directly to the URL. This state tree is updated as a function of the URL. Updates to the URL call the root router which calls its child routers, which call their child routers, etc... Each router controls how the URL state reduces its state.
This is a very similar paradigm to redux.

For example, a stack router could have a URL query param such as `order=1`. This URL state could map to a router property called `order`, which could be used in the app to control the `z-index` of multiple modals.

#### Observable Routers

Each router returns an observable subject upon initialization. These subjects are used in the app to allow components to react specifically to individual router state changes.

By making routing state a function of the URL, and decoupling the routing state from the logic that controls rendering, it becomes trivial to share routing configuration cross platform, share application state with other users, and provide deep linking.

#### Easily extendable

Each router type has a specific reducer that controls how URL state maps to router state.

This library comes with three predefined routers: `Stack router`, `Switch router`, and `Feature router`. These three routers have unique reducers which allow for most types of complex transitions found in modern web and mobile apps.

However, if you wish to write a custom router that controls how the URL reduces its state, all you need to do is extend the base router class and write a custom reducer method.

#### Mobile friendly

If routing state is a function of the URL, how do mobile apps, which don't have a URL, work?

Simple! The URL is simply a representation of the routing state tree. A string is still used to represent this state tree. Although a user won't see it directly on mobile, a state tree is still used to represent routing state, and each routers state is a function of this state tree.

## Why not just use redux or mobx directly?

You could! This library just abstracts away the maping of URL state to a state tree.

## How is this different than `react-router` and similar libraries?

react-router is usually implemented as a platform specific router. It abstracts away the routing state in favor of directly controling rendering of components. Although at first pass this might seem more idiomatic, since you can functionally compose routing of components into the app, it makes it difficult to control specific enter and exit transitions because adding transition helpers like `react-transition-group` is non-trivial with these libraries. Providing different enter and exit transitions based on historical routing state opens up a whole world of awesome UX-ness.
Additionally, complex routing becomes very hard without digging into a lengthy API. This library has a very simple API.
