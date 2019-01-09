# recursive-router
RouX - The saucy router.

"The delicious carb and fat base for your well-roasted app's gravy."

Simple, Reactive, Platform Agnostic, and Opinionated ROUTING

|   | Roux |
| - | ------------ |
|   | View library independent - works with Angular, Vue, React, or your favorite hacked together JS lib |
|   | Router state as a direct function of location (URL) |
|   | Lifecycle hooks - easily add a `before` Auth guard to a Router path |
|   | Extensible - just subclass the main Router and add a new routing method describing how the location reduces to a new router state |
|   | History is recorded - 1. transition a scene out or in differently depending on what other scene is coming or going 2. trivially persist router history outside the browser session and even send it along while deep linking |
|   | Deep linking is trivial - since state is a function of location, you can use a URL to generate an identical router state tree on any platform |
|   | Opinionated and automatic URL construction - There is no need to think about matching path names or constructing search params.  |
|   | Small size - The only peer dependency is MobX |
|   | Reactive - subscribe components to the state of a router |
|   | Simple - declare the route tree using a small syntax set |

If you are like me, and dislike how much ceremony is around installing and setting up a router, then this library may be something that interests you.

To get started, just layout the router state tree as a series of nested router objects. The type of nesting is defined using the keywords `Stack`, `Switch`, `Feature`, and `Page`. Upon creation you are returned subscribeable objects that you can use to observe each routers state. For example, you can have a component observe the order state of a modal in a `Stack` or the visibilty state of a scene in a `Switch`.

Simple, expressive, mobx-based routing state management. Routers all the way down

This library aims to make complex, platform-independent, historically influenced, and context dependent routing simple!

Simple API and small footprint.

## What makes this routing library different?

#### Platform independent

This library only controls the routeable state, not the logic that renders components, elements, etc...

This ensures platform independence and easy reuse of routing configuration across platform specific apps. For example, you can share the same routing configuration between a React app and it's sibling React Native app.

#### State as a function of URL

Instead of having the routing state update the URL, the routing state is a function of the URL.

Routers / Users / Browser API -> Url -> Routing state -> Component Renderings

The routeable state is a state tree that maps directly from the URL. This state tree is updated as a function of the URL. Updates to the URL call the root router which calls its child routers, which call their child routers, etc... Each router controls how the URL state reduces its state.
This is a very similar paradigm to redux.

For example, a stack router could react to a URL query param such as `a_order=1&b_order=2`. This URL state could map to a router property called `order`, which could be used in the app to control the `z-index` of multiple modals, `a` and `b` using the `Stack router`. If a user shares the url with a friend, the correctly ordered modals should be rendered. Furthermore, if a user manually edits the URL, the app should respond correctly.

#### Observable Routers

Each router returns an observable subject upon initialization. These subjects are used in the app to allow components to react specifically to individual router state changes.

By making routing state a function of the URL, and decoupling the routing state from the logic that controls rendering, it becomes trivial to share routing configuration cross platform, share application state with other users, and provide deep linking.

#### Easily extendable

Each router type has a specific reducer that controls how URL state maps to router state.

This library comes with three predefined routers: `Stack router`, `Switch router`, and `Feature router`. These three routers have unique reducers which allow for the creation of most types of complex transitions found in modern web and mobile apps.

However, if you wish to write a custom router that controls how the URL reduces its state, all you need to do is extend the base router class and write a custom reducer method.

#### Mobile friendly

If routing state is a function of the URL, how do mobile apps, which don't have a URL, work?

Simple! The URL is simply a representation of the routing state tree. A string is still used to represent this state tree. Although a user won't see it directly on native mobile, a state tree is still used to represent routing state, and each routers state is a function of this state tree.

## Why not just use redux or mobx directly?

You could! This library just abstracts away the mapping of URL state to a state tree. Plus, a few other niceties are provided :)

## How is this different from existing libraries?

#### Control of rendering

react-router, react-navigation, etc.. are usually implemented as a platform specific router. They abstract away the routing state in favor of directly controlling rendering of components. Although at first pass this might seem more idiomatic (since you can functionally compose routing of components into the app), it makes it much more difficult to do other things - such as sharing code cross platform, interacting with the routing components JSX, modifying the URL outside the routers API, trying to quickly throw a new router into the app without revisiting a relatively large API, etc...

such as trying to control specific enter and exit transitions - because adding transition helpers like `react-transition-group` can be non-trivial with these libraries. Providing different enter and exit transitions based on historical routing state opens up a whole world of awesome UX-ness.

Note: On React Native, react-navigation uses native components to increase the speed of rendering. Since, this library is only concerned with state, you would need a wrapper component that renders native components if you want this speed boost. However, for a lot of apps it may not be necessary.

#### API size

With existing libraries, complex routing is very hard without digging into a lengthy API. This library has a very simple API.

#### URL construction

Most libraries require you to define a `path` and/or `param`. These are used to match the URL to a router and trigger some routing logic. This library constructs the URL for you automatically, based on how you initialize the routers. This drastically simplifies things. No more Regex matching against a string to control state!

## Downsides

#### URL character limit

The main downside is that some browsers place a limitation on the number of characters that can be found in a URL to about 2,000. However, 2,000 characters should be more than enough for most production applications if you manually set the routers `routing keys` to single characters or turn on `url minimization`.

#### Resolving initial state

If the router state is persisted and a user pastes a link that changes the URL, there is a question of whether the link URL or the persisted URL should be used to update the router for the initial state construction. This library takes the opinion that the link URL should be used, but you can configure this on a per router, and context-dependent basis.  
