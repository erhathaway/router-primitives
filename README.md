# Recursive Router     


Recursive router is a different take on routing. 

With Recursive, the URL is a reflection of your app. Instead of defining how the URL is constructed you **define the visual elements of your app**. URL construction is automatically handled for you, based on the hierarchical arrangement of layout primitives (`Scene`, `Stack`, `Feature`, `Data`)! 

If you work on a platform where there is no concept of a URL, you can still use this library. The URL is simiply managed serialized state - which is platform aware and configurable!

Bindings exist for **[Mobx](https://github.com/erhathaway/recursive-router-mobx)**, **Redux**, and **[React](https://github.com/erhathaway/recursive-router-react)**.

# Intro

#### Documentation

- **[Intro](#intro)** :point_left:
- [API](#api)
- [Usage](#usage)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Extensions](#extensions)

## About

##### TL;DR

Describe the layout of your app in terms of `scene` `stack` `feature` and `data` routers

#### Paradigm 

In the context of this library, a router should be thought of as a feature of your application that responds to actions of other application features. 

For example, a router can be 'visible' when other routers are 'hidden'. This type of logic is what a scene router uses. Or, as another example, a router can be 'in front of' or 'behind' other routers. This type of logic is what a stack router uses. By defining your application in terms of visual elements like `scene` or `stack` (along with `feature` and `data`) you can implement variations of complex application routing. 

#### Goals 

The goal of this library is to provide declarative ways to perform complex routing, based on things like: sibling router state, neighborhood router state, historical state, deep linking, serialization of arbitrary data into router path, etc. 

Recursive tries to be modular, extensible, and framework agnostic. Thus, it can work directly in your app or you can use bindings for Mobx, Redux, and/or React. 

#### Bindings

React bindings: [github.com/erhathaway/recursive-router-react](https://github.com/erhathaway/recursive-router-react)
- Skip outside router config and manager initialization. Configure and initialize everything from within `Router` components.
- Wrap app components in `Router` components to get access to router methods and state - via props passing and functions-as-children (FAC)

Redux bindings: [github.com/erhathaway/recursive-router-redux](https://github.com/erhathaway/recursive-router-redux)
- Dispatch router state changes through the redux bus
- Persist router state in the redux store

Mobx bindings: [github.com/erhathaway/recursive-router-mobx](https://github.com/erhathaway/recursive-router-mobx)
- The router instance is now a Mobx instance. 
- All observable state is accessible directly as attributes on the router. No need to call the `state` or `history` getters.

#### Custom Router Logic

Should the existing router types not be enough, this library provides you with a way to create your own routers! See [Router templates](#extensions)

## How it works

1. Recursive treats the URL as a namespace for the storage of a state tree representing `all routable state`™. 
2. Writing to the URL is handled by the router and via direct user modification.
3. Changes to the URL are reduced over the router state tree
4. Various types of routers in the router state tree exist. The differences are used to control how their state will get updated when the URL changes.
5. Once the router state tree has been updated, observers of only updated routers are notified.

## Summary

|   | Recursive Router |
| - | ------------ |
| 😎 | View library agnostic - with bindings for React |
| ✨ | Router state as a direct function of location (URL) |
| ⏱ | Built in history - Previous router state can be derived
| 🔀 | One way data flow. Location -> Router State tree -> App |
| 🔗 | Trivial Deep linking - Use the URL to generate an identical router state tree on any platform |
| 😱 | Opinionated and automatic URL construction |
| 🚀 | Reactive - Subscribe to the state of any router in the router state tree |
| 👌 | Simple - Declare the route tree using a small but expressive syntax set |

# API

#### Documentation

- [Intro](#intro)
- **[API](#api)** :point_left:
- [Usage](#usage)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Extensions](#extensions)

## Manager

The manager is what you use to add routers to your app. You can either add a tree of routers during initialization, or add them one at a time afterwards

## Router Declaration

When you initialize the manager, you have the option of supplying an initial router tree. The router tree is how you describe the layout of your app in terms of routers:

```
                                                   [root Rouer]
                         _______________________________|______________________________
                         |                              |                             |
                [feature Router]                 [sceneA Router]              [sceneB Router]
                         |                    __________|_________                    |
                         |                    |                  |                    |
                  [sceneF Router]     [sceneC Router]     [sceneD Router]      [dataA Router]
                                              |
                                              |
                                       [dataB Router]

```
Each router in the router tree is simply a javascript object:

| Name | Description | Requried | Default |
| ---- | ----------- | -------- | ------- |
| `name` | The router name | YES | |
| `type` | The router type | YES | |
| `routeKey` | The keys used to construct the URL (location) | NO | defaults to the `name` if none is specified |
| `routers` | Child routers of this router | NO | |
| `options.isPathRouter` | If should forceibly be part of pathname. See [pathname](#pathname) | NO | False |

## Router Instance

Once you have have added a router to the manager, using a router declaration object or tree of router declaration objects (see above), the manager will have created Router instances to represent each node in the tee. These router instances are the main way you will control routing in your app.

### Methods 

| Name | Description |
| ---- | ----------- | 
| `show` | Shows the router |
| `hide` | Hides the router |
| `neighborsOfType` | Other routers in the same neighborhood and **Not** of the same type |
| `subscribe` | Subscribes an observer to changes in the router state |
| `<actions>` | Other actions may exist depending on the router type. See [Router Types](#Router-Types) |

### Attributes

| Name | Type | Description |
| ---- | ---- | ----------- | 
| `manager` | Manager Instance | Returns the current manager overseeing the routers | 
| `siblings` | Array | Other routers in the same neighborhood and of the same type |
| `state` | Object | Router state. See [Router Types](#Router-Types) for specific attributes |
| `history` | Array | An array of previous router states |

## Router types

Almost all routeable and dynamic apps can be expressed in terms of 4 predefined router types: `Stack`, `Scene`, `Feature`, and `Data`. If these routers don't suit your needs, you can easily create your own router type via [Router Templates](#extensions).


# The 4 main router primitives

## Scene
```
             +--------------------------------+
             |                                |
             |                                |
+---------+  | ---.____    ,/k.               |  +---------+
|  |\_/|  |  |  ___,---'  /  ih,__,-----.___  |  |    /.)  |
|  `o.o'  |  |         ,-' ,  `:7b----.__---` |  |   /)\|  |
|  =(_)=  |  |     _.-/   '  /b.`.4p,         |  |  // /   |
|    U    |  |  --"  ,    ,-' ^6x, `."^=._    |  | /'" "   |
+---------+  |                                |  +---------+
     ?       |                                |     pils
             |                                |
             +--------------------------------+
                           itz 
```                         
The scene router's purporse is to represent layouts where you only want 1 item in a certain view at a time. For example, you may only want 1 scene to be large while all it's sibling scenes are small. Or, you may want 1 scene to be visible while all the sibling scens are hidden. In the above layout, we have `itz` as the only scene that is large. Thus, to program this, we would say that all scene's should be small unless their state is `visible`, in which case be large.

### Methods 

You can control a scene router using the methods:

**`show`** | `() => void`

**`hide`** | `() => void`

If you show a scene router that is not visible, it will become visible and all sibling scene routers will be hidden.

### Attributes 

The state of the router can be accessed using the `getters`:

**`state`** | `{ visible: boolean }`

**`history`** | `Array<{ visible: boolean }`

History is an array of previous states. The newer states have smaller indices.

### Serialized state 

The scene router primitive will store its state in the `pathname` or `query` part of the `serialized state store`, which will likely be the `URL` if you use the primitive in web browser app.

Some example URLs are:

 - `http://<something>/sceneA/2/sceneB` 
 
 - `http://<something>/sceneA?sceneC` 
 
By default, a scene router will appear in the `pathname` part of the URL if:
 
 1. All of its parents are `scene` routers
 
 or
 
 2. All of its parents are `scene` or `data` routers as long as the `data` has no scene routers in its neighborhod (its immeidate parent) or has the option `isPathRouter` set to `true` in the router declaration object.

## Stack
```

+--------------+
|  _~          | 
|   _~ )_)_~   |
|   )_))_))_)  |
|   _!__!__!_  |
|   \______t/  |
| ~~~ @+-------+--------+
|     |                 |
+-----+      |\_/|      +-------+
      |      `o.o'      |       |
      |      =(_)=      |  /.)  |
      |        U        | /)\|  |
      |                 |/ /    |
      +------------+----+" "    |
                   +------------+
```                         
The stack router's purporse is to represent layouts where have multiple scenes that are visible but they need to have some order about them. For example, you may want a scene to be above all the other scenes, as is the case with stackable modals. 
### Methods 

You can control a scene router using the methods:

**`show`** | `() => void`

**`hide`** | `() => void`

**`toFront`** | `() => void`

**`toBack`** | `() => void`

**`forward`** | `() => void`

**`backward`** | `() => void`

If you show a stack router that is not visible, it will become visible and jump to the front of the stack. 

### Attributes 

The state of the router can be accessed using the `getters`:

**`state`** | `{ visible: boolean }`

**`history`** | `Array<{ visible: boolean }`

History is an array of previous states. The newer states have smaller indices.

### Serialized state 

The stack router primitive will store its state in only the `query` part of the `serialized state store`, which will likely be the `URL` if you use the primitive in web browser app.

An example URL is:

 - `http://<something>?feature1&feature2`

### `Feature` router

**Function**: show multiple routers at a time with no sense of ordering 

**URL Access**: write to only `search` part of url

| | |
|-|-|
| **states**      | `visible` |
| **actions**     | `show hide` |

example url 
- `http://<something>?feature1&feature2` |

### `Data` router

**Function**: show a string of data in the url to set things like page number, item ID, and callback urls 

**URL Access**: write to both `path` and `search` parts of url

| | |
|-|-|
| **states**      | `visible` |
| **actions**     | `show hide` |

example url 
- `http://<something>?data1&data2`
- `http://<something>/data3/?data1&data2`

# Usage

#### Documentation

- [Intro](#intro)
- [API](#api)
- **[Usage](#usage)** :point_left:
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Extensions](#extensions)

## Example (with Mobx)

### 1. Describe the layout of your app in terms of multiple `Stack`, `Scene`, `Feature`, and `Data` routers.

Each router is a javascript object with the keys: `name`, `routers`
```javascript
  { 
    name: 'user',
    routers: {},
  }
```

The `routers` key is used to specify other routers that are children of this router:
```javascript
  { 
    name: 'user',
    routers: {
      scene: [SceneRouer1],
      feature: [FeatureRouter1, FeatureRouter2],
      stack: [StackRouter1, StackRouter2],
      data: [DataRouter1],
    },
  }
```

An example app layout might look like:

```javascript
const tree =
  { name: 'root',
    routers: {
      scene: [
        { name: 'docs' 
          routers: { 
            feature: [{ name: 'doc-nav' }], 
            stack: [{ name: 'doc-intro' }, { name: 'doc-help' }], 
          }
        },
        { name: 'user', default: { visible: true }, routers: {<routersObj>} },
      ],
    },
  }
```

### 2. Register the router tree
```javascript
{ registerRouter } from 'recursive-router';

const routers = registerRouter(tree);
```

### 3. Observe when the routers have changed via the power of mobx

```html
<App>
  <NavBar>
    <Button onClick={routers['user'].show} />
    <Button onClick={routers['docs'].show} />
  </NavBar>
  <Scenes>
    <Docs visible={routers['docs'].visible}>
      <DocsNav visible={routers['doc-nav'].visible} onClickHelp={routers['doc-help'].show} />
      <MainContainer>
        <DocsIntro visible={routers['doc-intro'].visible} />
      </MainContainer>
      <DocsHelp visible={routers['doc-help'].visible} />
    </Docs>
    <User visible={routers['user'].visible} />
  </Scenes>
</App>
```

# Configuration 

#### Documentation

- [Intro](#intro) 
- [API](#api)
- [Usage](#usage)
- **[Configuration](#configuration)** :point_left:
- [Architecture](#architecture)
- [Extensions](#extensions)

## Default Visibility

By default, all routers are hidden - aka `visible: false`.

To have certain routers become visible when their immediate parent is visible, you can set the `defaultVisible` key to `true` in your router declaration object.

```javascript
{ 
  name: my-router
  routers: {
    scene: [<child-scene-router>, <other-child-scene-router>],
    data: [<child-data-router>],
  },
  defaultVisible: true,
}
```
    

## URL Construction 

URL construction is automatically handled for you based on the router hierarchy you define.

The URL represents the routing state of an app, known as the `location`. The location consists of two parts, the pathname and query params. The ordering of names in the pathname can be configured, and the names of keys that make up the pathname and query params can be set.

URL breakdown:

`https://github.com/ <pathname-part1> / <pathname-part2> ? <query-params>`

#### Pathname
The pathname part of a url is the union of router names that make up the longest visibile path of `Scene` and `Data` routers from the root router.

If there are both `Scene` and `Data` routers are neighbors (same level in router tree) in a path, the `Scene` router is always used for the pathname, unless the `Data` router explicitly sets the config option `isPathRouter = true`

```javascript
{
  name="my-router",
  routers: <Routers Obj>,
  config: { isPathRouter: true }
}
```

Example using [React bindings](https://github.com/erhathaway/recursive-router-react):

```html
<Router type="scene" name="user">
  <Router type="feature" name="admin-tray" />
  <Router type="data" name="user-id">
    <Router type="data" name="content-date" isPathRouter={true} />
      <Router type="scene" name="content-overview" />
      <Router type="scene" name="content-details" />
    </Router>
    <Router type="scene" name="user-options" />
  </Router>
<Router>
```

In this example, the viable paths are:

```
/user
/user?admin-tray=true
```
```
/user/:user-id
/user/:user-id?admin-tray=true
```
```
/user/:user-id/:content-date
/user/:user-id/:content-date?admin-tray=true
/user/:user-id/:content-date?admin-tray=true&user-options=true
/user/:user-id/:content-date?user-options=true
```
```
/user/:user-id/:content-date/content-overview
/user/:user-id/:content-date/content-overview?admin-tray=true
/user/:user-id/:content-date/content-overview?admin-tray=true&user-options=true
/user/:user-id/:content-date/content-overview?user-options=true
```
```
/user/:user-id/:content-date/content-details
/user/:user-id/:content-date/content-details?admin-tray=true
/user/:user-id/:content-date/content-details?admin-tray=true&user-options=true
/user/:user-id/:content-date/content-details?user-options=true
```

Notice two things:

- `user-id` is a `Data` router and is part of the pathname but **doesn't** have `isPathRouter=true`. This is becuase, explicitly setting `isPathRouter` is not not needed if the data router has no `Scene` routers as neighbors.

- `user-options` is a `Scene` router but isn't being used in the pathname. This is because it has a `Data` router as a neighbor that is explicitly set with `isPathRouter=true`.


#### Route Key

The `routeKey` option allows you to alias router names to another value used in the URL (location).

For example, setting the `routeKey` could allow you to transform:

`https://github.com/scene1RouteKey/scene2RouteKey?queryRouteKey1=1&queryRouteKey2=some-random-value`

to

`https://github.com/a/b?c=1&d=some-random-value`


You can set the route key with the `routeKey` parameter:

```javascript
{
  name='my-router',
  routers: <Routers Obj>,
  routeKey: 'a',
}
```

With the [React bindings](https://github.com/erhathaway/recursive-router-react), this would look like:

```html
<Router name="my-router" type="scene" routeKey="a" />
```

## Rehydration of state after visibility change

All routers will by default rehydrate children routers back to how the chidlren were when the parent state changed. The exception to this is if a child in the branch had their state updated while said router was hidden. This setting can be overridden on a case-by-case basis during the router tree declaration. 


## V1 Roadmap

Release canidate is in PR: `architecture-update`

- [x] Add Types using TypeScript
- [x] Add options param to location actions (esp. for replace vs push router history)
- Add validations
  - [ ] templates
  - [x] uniqueness of route keys
  - [x] uniqueness of router names
- [x] Add ability to clean up removed routers (subscriptions etc...)
- [x] Add tslint
- [ ] Add CI
- [ ] Add mobx bindings
- [ ] Update playground to use new mobx bindings
- [ ] Add react bindings
  - [ ] add 'guards' to react bindings
- [ ] Add redux bindings
- [ ] Demo apps built with `recursive-router`

