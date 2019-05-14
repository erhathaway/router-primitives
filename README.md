# Router Primitives     


Router Primitives is a different take on routing. 

With Router Primitives, the URL is a reflection of your app. Instead of defining how the URL is constructed you **define the visual elements of your app**. URL construction is automatically handled for you, based on the hierarchical arrangement of router primitives (`Scene`, `Stack`, `Feature`, `Data`)! 

If you work on a platform where there is no concept of a URL, you can still use this library. The URL is simiply managed serialized state - which is platform aware and configurable!

Bindings exist for **[Mobx](https://github.com/erhathaway/recursive-router-mobx)**, and **[React](https://github.com/erhathaway/recursive-router-react)**.

|   | Summary |
| - | ------------ |
| 😎 | View library agnostic - with bindings for React |
| ✨ | Router state as a direct function of location (URL) |
| ⏱ | Built in history - Previous router state can be derived
| 🔀 | One way data flow. Location -> Router State tree -> App |
| 🔗 | Trivial Deep linking - Use the URL to generate an identical router state tree on any platform |
| 😱 | Opinionated and automatic URL construction |
| 🚀 | Reactive - Subscribe to the state of any router in the router state tree |
| 👌 | Simple - Declare the route tree using a small but expressive syntax set |


# Intro

#### Documentation

- **[Intro](#intro)** :point_left:
- [API](#api)
- [Primitives](#primitives)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Extensions](#extensions)

## About

##### TL;DR

Describe the layout of your app in terms of `scene`, `stack`, `feature`, and `data` routers

#### Paradigm 

In the context of this library, a router should be thought of as a feature of your application that responds to actions of other application features. 

For example, a router can be 'visible' when other routers are 'hidden'. This type of logic is what a scene router uses. Or, as another example, a router can be 'in front of' or 'behind' other routers. This type of logic is what a stack router uses. By defining your application in terms of visual elements like `scene` or `stack` (along with `feature` and `data`) you can implement variations of complex application routing. 


You can use this library directly in an app or web page, however there also exist bindings to React and Mobx.

#### How it works

1. Router Primitives treats the URL as a namespace for the storage of a state tree representing `all routable state`™. 
2. Writing to the URL is handled by the router and via direct user modification.
3. Changes to the URL are reduced over the router state tree
4. Various types of routers in the router state tree exist. The differences are used to control how their state will get updated when the URL changes.
5. Once the router state tree has been updated, observers of only updated routers are notified.


#### Custom Router Primitives

Should the existing router primitives not be enough, this library provides you with a way to create your own routers! See [Router templates](#extensions)

# Examples

#### Documentation

- [Intro](#intro)
- **[Examples](#examples)** :point_left:
- [API](#api)
- [Primitives](#primitives)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Extensions](#extensions)


#### Mobx Example

Router logic defined in Javascript and JSX land

`Note: The mobx bindings are required for this to work.`

```typescript
import {Manager} from 'router-primitives';

const routerTree = { 
  name: 'root',
  routers: {
    scene: [
      { name: 'user' },
      { 
        name: 'docs',
        routers: {
          feature: [{ name: 'doc-nav' }],
          scene: [
            { name: 'doc-intro' },
            { name: 'doc-help' }
          ]
        }
      }
    ]
  }
};

const manager = new Manager({ routerTree })
const routers = manager.routers
```

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
        { routers['doc-intro'].visible ? <DocsIntro /> : <HelloMessage /> }
      </MainContainer>
      <DocsHelp visible={routers['doc-help'].visible} />
    </Docs>
    <User visible={routers['user'].visible} />
  </Scenes>
</App>
```

#### React Example

All router logic defined in JSX land

`Note: The react bindings are required for this to work.`

```html
<App>
  <NavBar>
    <Router name="user">{router => <Button onClick={router.show} />}</Router>
    <Router name="docs">{router => <Button onClick={router.show} />}</Router>
  </NavBar>
  <Scenes>
    <Router name="docs" parent="root" type="scene">
      {docsRouter =>
        docsRouter.visible && (
          <Docs>
            <Router
              name="docs-nav"
              parent="docs"
              defaultShow={true}
              type="feature"
            >
              {docNavRouter =>
                docNavRouter.visible && (
                  <Router name="docs-help">
                    {docHelpRouter => (
                      <DocsNav onClickHelp={docHelpRouter.show} />
                    )}
                  </Router>
                )
              }
            </Router>
            <MainContainer>
              <Router
                name="docs-intro"
                parent="docs"
                defaultShow={true}
                type="scene"
              >
                {docIntroRouter => (
                  docIntroRouter.visible ? <DocsIntro /> : <HelloMessage />
                )}
              </Router>
            </MainContainer>
            <Router name="docs-help" parent="docs" type="scene">
              {docHelpRouter => docHelpRouter.visible && <DocsHelp />}
            </Router>
          </Docs>
        )
      }
    </Router>
    <Router name="user" parent="root" defaultShow={true} type="scene">
      {router => router.visible && <User />}
    </Router>
  </Scenes>
</App>;
```

# API

#### Documentation

- [Intro](#intro)
- [Examples](#examples)
- **[API](#api)** :point_left:
- [Primitives](#primitives)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Extensions](#extensions)

## API Overview

The API consists of 3 classes: `manager`, `router`, `serializedStateStore`, and 1 configuration object, a `routerDeclaration`.

#### `manager` class: 

```typescript
  const manager = new Manager({ routerTree });
```

  - The manager ties all the `routers` together. It is how you add, remove, and list routers.

#### `router` class: 

```typescript
  const myRouter = manager.routers['myRouterName'];
```

  - A router backs every router you define (via `routerDeclaration` objects). Routers all have a unique name and can be one of the 4 primitive types (`scene`, `stack`, `data`, and `feature`).

#### `serializedStateStore` class: 

```typescript
  const {serializedStateStore} = manager;
```

 - The serialized state all routers is stored in this store. If your app runs in a web browser, this store is a wrapper around the native History API. The store changes to work with different platforms. You can use the serialized state store to move the app `forward` or `backwards` through history.

 
#### `routerDeclaration` config:

 ```typescript
  const routerTree = {
    name: 'root',
    routers: {
      scene: [
        { name: 'myFirstScene'},
        { name: 'mySecondScene'}
      ]
    }
  };

  const manager = new Manager({ routerTree });

  const myNewRouter = { 
    name: 'newRouter', 
    type: 'scene', 
    parent: 'root' 
  };

  manager.addRouter(myNewRouter);
```

 - Simply an object that is used to specify how a router should be made. On `Manager` initialization, you can specify a tree of `routerDeclaration` objects. Or, once the Manager is initialized, you can add them to the Manager one by one.

## Manager

### Constructor

```typescript
import {Manager} from 'router-primitives'

const routerTree = {
  name: 'root'
  routers: { 
    scene: [{ name: 'home' }, { name: 'users' }, { name: 'settings }],
    feature: [{ name: 'side-nav' }]
  }
}

const manager = new Manager({ routerTree })
```

### Manager Methods

| Method | Type  | Description |
| ---- | ---- | ----------- | 
| `addRouters` | `manager.addRouters(router: IRouterDeclaration, type: RouterType, parentName: string)` | Add one router or an entire tree of router declaration objects |
| `addRouter` | `manager.addRouter(router: IRouterDeclaration)` | Add a single router |
| `removeRouter` | `manager.removeRouter(routerName: string)` | Remove a router |

### Manager Attributes

| Attribute | Type | Description |
| ---- | ---- | ----------- | 
| `routers` | `manager.routers: { [routerName: string]: IRouter }` | All of the routers the manager currently manages |
| `rootRouter` | `manager.rootRouter: IRouter` | the root router |
| `routerStateStore` | `manager.routerStateStore: IRouterStateStore` | The store used to store the serialized router tree state. This is likely a wrapper over the web history api if in a browser. |
| `primitives` | `manager.primitives: { [primitiveName: string]: RouterTemplate }` | The router primitives that exist. If you add a custom primitive you should see it here. |


## Router

Once you have have added a router to the manager, using a router declaration object or tree of router declaration objects (see above), the manager will have created router instances to represent each node in the tee. These router instances are the main way you will control routing in your app.

### Router Common Methods

All router instances have the following methods:

| Method | Signature | Description |
| ---- | ---- | ----------- | 
| `show` | `(options: IRouterOptions) => void` | Makes the router visible. This will update the router state tree and add the router `key` to the location | 
| `hide` | `(options: IRouterOptions) => void` | Makes the router invisible. This will update the router state tree and remove the router `key` from the location| 
| `getState` | `() =>  { current: IRouterState, historical: Array<IRouterState> }` | Gets the router state from the `routerStateStore`. This includes both the current state and the previous states. The history is configured to record a set number of previous states. This can be adjusted during manager initialization. |
| `neighborsOfType` | `() =>  Array<IRouter>` | Gets routers that have the same parent but are not of the same type |
| `subscribe` | `(fn: (newState) => any) => void` | Subscribe to router state changes |


### Router Common Attributes

All router instances have the following attributes:

| Attribute | Type | Description |
| ---- | ---- | ----------- | 
| `name` | `string` | router name |
| `type` | `'scene' | 'stack' | 'feature' | 'data'`| primitive type |
| `manager` | `IManager` | the manager controlling the router |
| `parent` | `IParent` | the parent of the router, if any |
| `routers` | `{ [routerType: string]: Array<IRouter>}` | the routers children |
| `root` | `IRouter` | the root router of the router tree |
| `config` | `IRouterConfig` | the config options set during initialization that customize the router's behavior |
| `isPathRouter` | `boolean` | whether the router will appear in the pathname or query part of the location |
| `siblings` | `IRouter[]` | routers of the same primitive type who share the same parent |
| `state` | `IRouterState` | the current state of the router |
| `history` | `IRouterState[]` | previous states of the router |


### Primitive Specific Methods

Additonal methods may exist depending on the particular router primitive. For example, `stack` routers also have the methods `forward`, `backward`, `toFront`, `toBack`. Also, `data` routers has the method `setData`.

#### Data Router

| Method | Signature | Description |
| ---- | ---- | ----------- | 
| `setData` | `(data: string) => void` | sets the data for the data router |


#### Stack Router

| Method | Signature | Description |
| ---- | ---- | ----------- | 
| `forward` | `(options: IRouterOptions) => void` | increments the router position forward by 1 |
| `backward` | `(options: IRouterOptions) => void` | decrements the router position forward by 1 |
| `toFront` | `(options: IRouterOptions) => void` | sets the router position to 0 |
| `toBack` | `(options: IRouterOptions) => void` | sets the router position to largest position number |


# Primitives

#### Documentation

- [Intro](#intro)
- [Examples](#examples) 
- [API](#api) 
- **[Primitives](#primitives)** :point_left:
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Extensions](#extensions)

Almost all routeable and dynamic apps can be expressed in terms of 4 predefined router types: `Stack`, `Scene`, `Feature`, and `Data`. If these routers don't suit your needs, you can easily create your own router type via [Router Templates](#extensions).

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
The scene router's purpose is to represent layouts where you only want 1 item in a certain view at a time. For example, you may only want 1 scene to be large while all it's sibling scenes are small. Or, you may want 1 scene to be visible while all the sibling scenes are hidden. In the above layout, we have `itz` as the only scene that is large. Thus, to program this, we would say that all scene's should be small unless their state is `visible`, in which case be large.

#### Serialized state 

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
The stack router's purpose is to represent layouts where have multiple scenes that are visible but they need to have some order about them. For example, you may want a scene to be above all the other scenes, as is the case with stackable modals. 

#### Serialized state 

The stack router primitive will store its state in only the `query` part of the `serialized state store`, which will likely be the `URL` if you use the primitive in web browser app. The store keys are `router.routeKey` and the values are the ordering of sibling routers with respect to one.

An example URL is:

 - `http://<something>?stack1=0&stack2=1`

Note the order of `stack` is `0`, and the order of `stack2` is `1`

## Feature
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
The feature router's purpose is to coexist seamlessly with other routers of the same parent. Sibling feature routers (routers with the same parent) will not affect the presence of one another. 


#### Serialized state 

The feature router primitive will store its state in only the `query` part of the `serialized state store`, which will likely be the `URL` if you use the primitive in web browser app.

An example URL is:

- `http://<something>?feature1&feature2`


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
- [Examples](#examples)
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
- [Examples](#examples)
- [API](#api)
- [Primitives](#primitives)
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

#### Pathname precedence

The pathname part of a url is the union of router names that make up the longest visibile path of `Scene` and `Data` routers from the root router.

If there are both `Scene` and `Data` routers as neighbors (same level in router tree) in a path, the `Scene` router is always used for the pathname, unless the `Data` router explicitly sets the config option `isPathRouter = true`

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


## Naming of router state in the URL

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

# Architecture 

- [Intro](#intro)
- [Examples](#examples)
- [API](#api)
- [Primitives](#primitives)
- [Configuration](#configuration)
- **[Architecture](#architecture)** :point_left:
- [Extensions](#extensions)

TODO

# Extensions 

- [Intro](#intro)
- [Examples](#examples)
- [API](#api)
- [Primitives](#primitives)
- [Configuration](#configuration)
- [Architecture](#architecture)
- **[Extensions](#extensions)** :point_left:

The extensions API is currently unstable. Certain behavior (caching of child state, setting initialization defaults, and rehydrating router tree from new URLs) is implicit and needs to be rearchitected so there is a public API.

If need a customer router, you can make one by definting a router template.

TODO


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

