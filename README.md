# Router Primitives

[![npm](https://img.shields.io/npm/v/router-primitives.svg?label=&color=0080FF)](https://github.com/erhathaway/router-primitives/releases/latest)

Router Primitives is a **layout primitives** paradigm for application routing. Instead of focusing on pattern matching path names and query params, you describe the layout of your application in terms of router primitives. Primitives are composable and provide a simple declarative API to control routing actions and add complex animations.

# About

#### Documentation

-   **[About](#about)** :point_left:
-   [Usage](#usage)
-   [API](#api)
-   [Primitives](#primitives)
-   [Router Actions](#router-actions)
-   [Router Links](#router-links)
-   [Router State Predicates](#router-state-predicates)
-   [Custom Primitives](#custom-primitives)

## TL;DR

Describe the routing of your app in terms of **layout primitives**.

Current router primitives are `scene`, `stack`, `feature`, and `data`, but you can easily define custom ones using simple template objects.

-   Scene: sibling routers take the place of one another.
-   Stack: sibling routers have an order with respect to one another.
-   Feature: don't affect other routers. They are either visible or not.
-   Data: add data to the url.

## Overview

Normally, with application routers, you define how path names and query params map to various elements of your application via pattern matching. When a match is found, you execute logic to show, hide, or move the element.

With `Router Primitives`, you don't need to think about pattern matching at all! You simply describe how your app is layed out in terms of scenes, stacks, features, data, and other router primitives.

The hierarchial arrangement of these layout primitives, in a `router declaration` object, generates routers that automatically construct the URL based on triggered actions (`show`, `hide`, etc...). Routers handle all layout level routing logic without need for additional code. This means that you don't need to write code to show, hide, or move elements with respect to one another.

For instance, sibling Scene routers automatically hide all other scenes when one of them becomes visible. This is similar to React Routers `switch` component. Or, as another example, Stack routers keep track of a position. If one sibling stack router jumps to the first position, the other siblings increment their position accordingly. These are useful if you have multiple modals, toast notifications, or other components that you want to register in the URL and be ordered.

Router Primitives is written as a high level abstraction to free developers from having to write the same routing logic over and over again. It's designed to have a simple, small, and declarative API with sensible ways to do complex and deterministic animations based on current router state, historical router state, and sibling router state.

If you work on a platform where there is no concept of a URL, you can still use this library. The URL is simply managed serialized state - which is platform aware and configurable!

Finally, Router Primitives is platform agnostic. This means that you can use the same router code for various frameworks and platforms. Currently, bindings exist for **[Mobx](https://github.com/erhathaway/recursive-router-mobx)**, and **[React](https://github.com/erhathaway/recursive-router-react)**.

## Key Features

|     |                                                                                          |
| --- | ---------------------------------------------------------------------------------------- |
| 😎  | View library agnostic - with bindings for React and Mobx                                 |
| ✨  | Router state as a direct function of location (URL)                                      |
| ⏱   | Built in history - Previous router state is tracked                                      |
| 🔀  | One way data flow. Location -> Router State tree -> App                                  |
| 🔗  | Trivial linking - Use the URL to generate an identical router state tree on any platform |
| 😱  | Best practice opinionated and automatic URL construction                                 |
| 🚀  | Reactive - Subscribe to the state of any router in the router state tree                 |
| 👌  | Simple - Declare the route tree using a small but expressive syntax set                  |
| 💃  | State predicate functions for making **complex animations easy**                         |

## Paradigm

In the context of this library, a router should be thought of as a feature of your application that responds to actions of other application features.

For example, a router can be 'visible' when other routers are 'hidden'. This type of logic is what a scene router uses. Or, as another example, a router can be 'in front of' or 'behind' other routers. This type of logic is what a stack router uses. By defining your application in terms of visual elements like `scene` or `stack` (along with `feature` and `data`) you can implement variations of complex application routing.

## How it works

1. Router Primitives treats the URL as a namespace for the storage of a state tree representing `all routable state`™.
2. Writing to the URL is handled by the router and via direct user modification.
3. Changes to the URL are reduced over the router state tree
4. Various types of routers in the router state tree exist. The differences are used to control how their state will get updated when the URL changes.
5. Once the router state tree has been updated, observers of only updated routers are notified.

## Custom Router Primitives

Should the existing router primitives not be enough, this library provides you with a way to create your own routers! See [Router templates](#extensions)

# Usage

#### Documentation

-   [About](#about)
-   **[Usage](#usage)** :point_left:
-   [API](#api)
-   [Primitives](#primitives)
-   [Router Actions](#router-actions)
-   [Router Links](#router-links)
-   [Router State Predicates](#router-state-predicates)
-   [Custom Primitives](#custom-primitives)

## 1. Declare the layout of your app in terms of router primitives

```typescript
import {IRouterDeclaration, AllTemplates} from 'router-primitives';

const routerDeclaration: IRouterDeclaration<AllTemplates> = {
    name: 'root',
    children: {
        scene: [
            {
                name: 'user',
                children: {
                    data: [{name: 'userId', isPathRouter: true}]
                }
            },
            {name: 'home', defaultAction: ['show']},
            {
                name: 'options',
                children: {
                    scene: [{name: 'appOptions', defaultAction: ['show']}, {name: 'userOptions'}]
                }
            }
        ],
        features: [{name: 'sideNav', routeKey: 'nav'}]
    }
};
```

The above router declaration would generate the following paths:

```
/user
/user?nav=true

/user/:userId
/user/:userId?nav=true

/home
/home?nav=true

/options
/options?nav=true

/options/appOptions
/options/appOptions?nav=true

/options/userOptions
/options/userOptions?nav=true
```

## 2. Build routers using the declaration object

```typescript
import {Manager} from 'router-primitives';

const manager = new Manager({routerDeclaration});

const {routers} = manager;
```

## 3. Use the routers to navigate

```typescript
routers.sideNav.subscribe(({visible}) => {
    console.log(`Side nav is changing state. Visible: ${visible}`);
});

routers.userId.subscribe(({data}) => {
    console.log(`The current userId is ${userId}`);
});

// the URL starts off at /home because the 'home' router has a default action of 'show'

routers.appOptions.show(); // transitions URL to /options/appOptions

routers.sideNav.show(); // transitions URL to /options/appOptions&nav

routers.userId.show({data: 1}); // transitions URL to /user/1&nav

routers.sideNav.hide(); // transitions URL to /user/1

routers.userOptions.link('show'); // generates the URL string for a link to this location
```

## 4. Use in React

TODO

# API

#### Documentation

-   [About](#about)
-   [Usage](#usage)
-   **[API](#api)** :point_left:
-   [Primitives](#primitives)
-   [Router Actions](#router-actions)
-   [Router Links](#router-links)
-   [Router State Predicates](#router-state-predicates)
-   [Custom Primitives](#custom-primitives)

This section contains minimal API documentation to get you started. For the extensive API docs see the [docs website](TODO).

## API: Manager

### Manager Methods

| Method         | Signature                                                                    | Description                                                    |
| -------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `addRouters`   | `(router: IRouterDeclaration, type: RouterType, parentName: string) => void` | Add one router or an entire tree of router declaration objects |
| `removeRouter` | `(routerName: string) => void`                                               | Remove a router                                                |

### Manager Attributes

| Attribute | Type                                | Description                                      |
| --------- | ----------------------------------- | ------------------------------------------------ |
| `routers` | `{ [routerName: string]: IRouter }` | All of the routers the manager currently manages |

## API: Router

### Router Common Methods

All router instances have the following methods:

| Method            | Signature                                                   | Description                                                                                                      |
| ----------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `show`            | `(options: IRouterOptions) => void`                         | Makes the router visible. This will update the router state tree and add the router `key` to the location        |
| `hide`            | `(options: IRouterOptions) => void`                         | Makes the router invisible. This will update the router state tree and remove the router `key` from the location |
| `neighborsOfType` | `() => Array<IRouter>`                                      | Gets routers that have the same parent but are not of the same type                                              |
| `subscribe`       | `(fn: (newState) => any) => void`                           | Subscribe to router state changes                                                                                |
| `link`            | `(actionName: string, options: IRouterOptions) => location` | generates a link that mimics what this action will do when pasted into the URL                                   |

### Router Common Attributes

All router instances have the following attributes:

| Attribute      | Type                                          | Description                                                                       |
| -------------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| `name`         | `string`                                      | router name                                                                       |
| `type`         | `string literal` - the name of a primitive    | primitive type                                                                    |
| `manager`      | `Manager`                                     | the manager controlling the router                                                |
| `parent`       | `Router` - union of all possible router types | the parent of the router, if any                                                  |
| `children`     | `{ [routerType: string]: Array<IRouter>}`     | the children routers of this router children                                      |
| `root`         | `Router`                                      | the root router of the entire router tree tree                                    |
| `config`       | `IRouterConfig`                               | the config options set during initialization that customize the router's behavior |
| `isPathRouter` | `boolean`                                     | whether the router will appear in the pathname or query part of the location      |
| `siblings`     | `Router[]`                                    | routers of the same primitive type who share the same parent                      |
| `state`        | `RouterState`                                 | the current state of the router                                                   |
| `history`      | `RouterState[]`                               | previous states of the router                                                     |
| `data`         | `any` - depending on the template             | the data the router has                                                           |

### Primitive Specific Methods

Additional methods may exist depending on the particular router primitive. For example, `stack` routers also have the methods `forward`, `backward`, `toFront`, `toBack`. Likewise, `data` routers has the method `setData`.

#### Data Router

| Method    | Signature                | Description                       |
| --------- | ------------------------ | --------------------------------- |
| `setData` | `(data: string) => void` | sets the data for the data router |

#### Stack Router

| Method     | Signature                           | Description                                         |
| ---------- | ----------------------------------- | --------------------------------------------------- |
| `forward`  | `(options: IRouterOptions) => void` | decrement the router position forward by 1          |
| `backward` | `(options: IRouterOptions) => void` | increments the router position forward by 1         |
| `toFront`  | `(options: IRouterOptions) => void` | sets the router position to 0                       |
| `toBack`   | `(options: IRouterOptions) => void` | sets the router position to largest position number |

# Primitives

#### Documentation

-   [About](#about)
-   [Usage](#usage)
-   [API](#api)
-   **[Primitives](#primitives)** :point_left:
-   [Router Actions](#router-actions)
-   [Router Links](#router-links)
-   [Router State Predicates](#router-state-predicates)
-   [Custom Primitives](#custom-primitives)

For the most part, you'll be able to express the route-able layout of your app in terms of the 4 predefined primitives: `Stack`, `Scene`, `Feature`, and `Data`.

-   Scene: sibling routers take the place of one another.
-   Stack: sibling routers have an order with respect to one another.
-   Feature: don't affect other routers. They are either visible or not.
-   Data: add data to the url.

The are 4 important configuration options each primitive has that you should take note of:

-   **show**: How it affects it's sibling(s)
-   **canBePathRouter**: Whether it can occupy the pathname part of the URL
-   **isPathRouterByDefault**: Whether it will occupy the pathname part of the URL by default
-   **isDependentOnExternalData**: Whether it is dependent on external (user) data

Lets walk through the different primitives and look at each consideration.

## Scene

**Scene primitives allow you to implement layout items that take the place of one another**

The scene router's purpose is to represent layouts where you only want 1 item in a certain view at a time. For example, you may want a `users` scene, a `info` scene, and a `product` scene, all with the same parent. Because these are all sibling scenes, only one of them will be visible at a time. Furthermore, because they are all `scene` primitives, they will occupy the same space in the location (URL) store. This allows you to have three URLs like: `mysite.com/users`, `mysite.com/info` and `mysite.com/product`.

| Option                        | Configuration                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **show**                      | Hides all sibling routers and makes router visible.                                                                                 |
| **canBePathRouter**           | Yes. As long as all parents are also path routers                                                                                   |
| **isPathRouterByDefault**     | Yes. As long as all parents are also path routers. Can be turned off by setting `isPathRouter` to `false` in the router declaration |
| **isDependentOnExternalData** | No.                                                                                                                                 |

## Stack

**Stack primitives allow you to implement layout items that have an ordering to them.**

> Note: Stack routers have the orders 1, 2, 3... . 0 index is not used.

The stack router's purpose is to represent layouts where have multiple items that are visible but they need to have some order about them. For example, you may have a bunch of modals that you want to display only on a certain page. You could make a bunch of stack routers such they they all have the page router as their parent. You could then control the ordering of the modals via their `order` state.

The stack router primitive will store its state in only the `query` part of the `serialized state store` (URL). The store keys are `router.routeKey` and the values are the ordering of sibling routers with respect to one another.

An example URL is:

-   `http://<something>?stack1=0&stack2=1`

Note the order of `stack1` is `1`, and the order of `stack2` is `2`

| Option                        | Configuration                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **show**                      | Moves the router to the first position and makes it visible. All sibling router positions are incremented. |
| **canBePathRouter**           | No.                                                                                                        |
| **isPathRouterByDefault**     | No.                                                                                                        |
| **isDependentOnExternalData** | No.                                                                                                        |

## Feature

**Feature primitives allow you to implement layout items that seamlessly coexist with one another**

The feature router's purpose is to coexist seamlessly with other routers of the same parent. Sibling feature routers (routers with the same parent) will not affect the presence of one another. For example, you could use a feature router to control whether a menu bar is opened or closed.

The feature router primitive will store its state in only the `query` part of the `serialized state store` (URL).

An example URL is:

-   `http://<something>?feature1&feature2`

| Option                        | Configuration                                               |
| ----------------------------- | ----------------------------------------------------------- |
| **show**                      | Makes the router visible. Has no affect on sibling routers. |
| **canBePathRouter**           | No.                                                         |
| **isPathRouterByDefault**     | No.                                                         |
| **isDependentOnExternalData** | No.                                                         |

## Data

**Data primitives allow you to markup the layout with arbitrary data**

The data router's purpose is to allow you to store data in the URL. This makes it possible to implement `page numbers`, `item IDs`, `callback URLs` etc... For example, you could wrap a `userId` data router in a `user` scene router. This would allow you to construct the urls: `mysite.com/user` and `mysite.com/user/:userId` (where `:userId` is variable data).

#### Serialized state (URL)

The data router primitive will store its state in both the `query` and `path` part of the `serialized state store` (URL).

Example URLs are:

-   `http://<something>?data1&data2`
-   `http://<something>/data3/?data1&data2`

| Option                        | Configuration                                                                                                                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **show**                      | Makes the router visible. Has no affect on sibling routers. Uses whatever data it has and sets it in the URL                                                                                                                                                                                                                               |
| **canBePathRouter**           | Yes. As long as all parent routers are also path routers _AND there are no other neighboring routers that are also path routers_                                                                                                                                                                                                           |
| **isPathRouterByDefault**     | No.                                                                                                                                                                                                                                                                                                                                        |
| **isDependentOnExternalData** | Yes. Data needs to be added via A. the `defaultAction` during the router declaration, B. the `data` option when calling the action (ex: `myDataRouter.show({data: 'somedata'})`), or in the `pathData` option when calling another router with this router in the path (ex: `mySceneRouter.show({pathData: {myDataRouter: 'someData'}})`)) |

# Router Actions

#### Documentation

-   [About](#about)
-   [Usage](#usage)
-   [API](#api)
-   [Primitives](#primitives)
-   **[Router Actions](#router-actions)** :point_left:
-   [Router Links](#router-links)
-   [Router State Predicates](#router-state-predicates)
-   [Custom Primitives](#custom-primitives)

Router actions are methods that do work. They allow you to change route location and set data. All routers have the actions `show` and `hide`. Routers can also have custom actions. For example, Data primitives have the `setData` action, and Stack primitives have the actions `toFront`, `toBack`, `forward`, and `backwards`.

## Calling a router action

```typescript
<myRouter>.<action>(<options>)
```

Example:

```typescript
myRouter.show({replaceLocation: true});
```

## Router action options

All actions take the same option type.

```typescript
export interface IRouterActionOptions<CustomState> {
    data?: CustomState;
    pathData?: Record<string, unknown>;
    disableCaching?: boolean; // the setting will only persist for the router
    replaceLocation?: boolean; // used to replace location in history rather than append to history
    dryRun?: boolean; // will prevent cache from being updated or the new location state from being stored
    addCacheToLocation?: boolean; // serializes the current router cache into the location. Useful for rehydrating exact router state.
}
```

| Option             | Explanation                                                                                                                                                                                                                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| data               | If this router is dependent on external data, this will set that data. Data routers can have their data set via this option                                                                                                                                                                                                                                               |
| pathData           | If this router isn't dependent on external data, but another router in the path that the action will render is, data can be set for that router with this option. For example: `myRouter.show({pathData:{myDataRouter: 'somedata'}})`                                                                                                                                     |
| disableCaching     | Router state is cached by default. If you want to disable caching for this router during this action run you can set it to `true`                                                                                                                                                                                                                                         |
| replaceLocation    | Every location change via an action is added to the platforms location history. However, sometimes you don't want to add to this history but rather replace the current location. You can do that by setting `replaceLocation: true`                                                                                                                                      |
| dryRun             | This will run the action executor but never use the new location (it won't be set to the history or URL). Instead, the location is returned. Internally, this option is how links are created via the `myRouter.link` method.                                                                                                                                             |
| addCacheToLocation | Internally router actions are cached. This gives the impression that you can navigate to where you left off rather than have the default actions run every time. However, this information is not existent in the URL. If you want to add it to the URL so that pasting it into another browser creates an identical router experience, this option will do that for you. |

# Router Links

#### Documentation

-   [About](#about)
-   [Usage](#usage)
-   [API](#api)
-   [Primitives](#primitives)
-   [Router Actions](#router-actions)
-   **[Router Links](#router-links)** :point_left:
-   [Router State Predicates](#router-state-predicates)
-   [Custom Primitives](#custom-primitives)

Often times, you'll want a link rather than calling an location action directly. The `link` method allows you to create such a link. It is essentially calling the action with the `dryRun` option.

Example usage:

```typescript
myRouter.link('show', linkOptions);
```

The options available to the link method are a subset of the `action options`. See [router action options](#router-action-options) for an overview.

```typescript
export interface ILinkOptions<CustomState> {
    data?: CustomState;
    pathData?: Record<string, unknown>;
    addCacheToLocation?: boolean; // serializes the current router cache into the location. Useful for rehydrating exact router state.
}
```

# Router State Predicates

#### Documentation

-   [About](#about)
-   [Usage](#usage)
-   [API](#api)
-   [Primitives](#primitives)
-   [Router Actions](#router-actions)
-   [Router Links](#router-links)
-   **[Router State Predicates](#router-state-predicates)** :point_left:
-   [Custom Primitives](#custom-primitives)

Arguably one of the hardest problems with routing is adding in complex animations / transitions. Router Primitives aims to make this easy by providing state predicates that can tell you if a particular state transition has occurred.

State predicates derive information off of the router passed into them. If you'd like to make your own check out [src/state_predicates.ts](/src/state_predicates.ts) for inspiration.

### Existing predicates

| Predicate                                  | Explanation                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| isVisible                                  | Whether the router is visible                                              |
| isHidden                                   | Whether the router is hidden                                               |
| isJustHidden                               | Whether the scene was just hidden in the last action                       |
| isJustShown                                | Whether the scene was just shown in the last action                        |
| isFirstTimeBeingShown                      | Whether the router is being shown for the first time                       |
| hasBeenShownBefore                         | Whether the router was ever shown in its past                              |
| scene.isVisibleSiblingsFirstTimeBeingShown | Whether the now visible sibling router is the first time being shown       |
| scene.hasVisibleSiblingBeenShownBefore     | Whether the now visible sibling has been visible before                    |
| stack.isMovingForward                      | Whether the order position is getting smaller (to the front)               |
| stack.isMovingBackward                     | Whether the order position is getting larger (to the back)                 |
| stack.isAtFront                            | Whether the order position is = 1                                          |
|                                            |
| stack.isAtBack                             | Whether the order position is the largest out of all sibling stack routers |
| stack.isPositionSameAsLastShown            | Whether the order position is the same as the last time it was shown       |

### Example state predicate usage

Lets look at how these can be used with a popular animation library like [Anime.js](https://github.com/juliangarnier/anime)

```typescript
import {statePredicates} from 'router-primitives';

const myRouterOfInterest = manager.routers.myRouterOfInterest;
const {isMovingForward} = statePredicates.stack;

if (isMovingForward(myRouterOfInterest)) {
    anime({
        targets: 'MyComponentId',
        translateX: 250
    });
}
```

Bindings to various view frameworks, like React, explicitly implement an API to make this even cleaner. For example:

```jsx
import anime from 'animejs';
import {statePredicates} from 'router-primitives';
import {when, and, createRouterComponents} from 'router-primitives-react';

const {
    isJustHidden,
    isJustShown,
    stack: {isMovingForward}
} = statePredicates;

const StackRouter = createRouterComponents(manager.routers).myRouterOfInterest;

<StackRouter
    onChange={[
        when(and(isMovingForward, isJustShown), uuid => anime({target: uuid, translateX: 250})),
        when(isJustHidden, uuid => anime({target: uuid, translateX: -250}))
    ]}
>
    {({uuid}) => <MyComponent id={uuid} />}
</StackRouter>;
```

# Custom Primitives

#### Documentation

-   [About](#about)
-   [Usage](#usage)
-   [API](#api)
-   [Primitives](#primitives)
-   [Router Actions](#router-actions)
-   [Router Links](#router-links)
-   [Router State Predicates](#router-state-predicates)
-   **[Custom Primitives](#custom-primitives)** :point_left:

Making custom primitives allows you to define new types of routing for your layout!

> It might be helpful to look at the [templates for `scene`, `stack`, `feature`, `data` primitives as a guide](/src/router_templates)

## Router Primitive Type Signature

A layout primitive is defined by a template which has the type type signature:

```typescript
type RouterTemplate = {
    actions: ActionFunction[];
    reducer: (newLocation: Location) => NewState;
    options: {
        canBePathRouter?: boolean;
        isPathRouter?: boolean;
        shouldInverselyActivate?: boolean;
        disableCaching?: boolean;
        shouldParentTryToActivateSiblings?: boolean;
        isDependentOnExternalData?: boolean;
    };
};

type ActionFunction = (
    options?: ActionOptions // Same options object that is talked about in the Router Actions section. These are set by the user to get specific action functionality.
    existingLocation?: Location, // The existing URL

    routerInstance?: Router, // The router that this function is a method on.
    ctx?: ActionContext // A context object that is passed to every action function in the chain of action functions that is kicked off by the users action call.
) => Location;

type Location = {
  path: string[], // the components that form the path part of the URL
  search: {}, // the components that form the query params pat of the URL
}

type NewState = {
  visible: boolean,
  data?: unknown // this type varies on a router by router basis. You define the type with a generic when making the template.
  actionCount: number // the action number that this state is associated with. Each action call increments the actionCount by 1.
}

```

### Overview of writing a template

#### Template Actions

When you write a template you need to define, at a minimum, the `show` and `hide` actions. You can add as many actions as you like as long as the name doesn't conflict with a method name defined in [router_base.ts](/src/router_base.ts).

The goal of an action is to take the existing `location` and return a `new location`. The template should only modify the location state of the router in the `routerInstance` param of the action function type. Additionally, in an action you may call sibling router actions.

#### Template Reducer

The goal of a reducer is to take the `final location` from the action call chain that a user initiated and reduce it down to a state specific to this router. The final reduction may modify the `visible` and `data` keys of the state object, but it should not touch the `actionCount` part.

#### Template Options

The template options do the following:

| Option                            | Purpose                                                                                                                                                                                                                                                                        | Default |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| canBePathRouter                   | Whether the primitive can occupy the pathname part of the URL                                                                                                                                                                                                                  | false   |
| isPathRouter                      | Whether it will occupy the pathname part of the URL by default                                                                                                                                                                                                                 | false   |
| isDependentOnExternalData         | Whether it is dependent on external (user) data                                                                                                                                                                                                                                | false   |
| shouldParentTryToActivateSiblings | Whether the parent of the primitive should check if it should be shown from the cache when a sibling primitive was activated                                                                                                                                                   | true    |
| disableCaching                    | Whether caching should occur for the primitive. Caching allows you to navigate to a different route and then come back to find the same cache state. For example, if you opened a menu, navigated away, and came back you could find the same menu open when cache is enabled. | false   |
| shouldInverselyActivate           | TODO                                                                                                                                                                                                                                                                           | TODO    |

### Using templates

```typescript
type CustomTemplates = {
    myTemplateName: myTemplate;
};

const manager = new Manager<CustomTemplates>({customTemplates, routerDeclaration});
```
