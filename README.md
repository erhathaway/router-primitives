# recursive-router

Simple cross platform reactive and declarative routing 

|   | Recursive Router |
| - | ------------ |
| 😎 | View library agnostic - works with Angular, Vue, React, or your favorite hacked together JS lib |
| ✨ | Router tree state as a direct function of location (URL) |
| ⏱ | Built in history - Previous router state can be derived from the current state
| 🔀 | One way data flow. Location -> Router State tree -> App |
| 🔗 | Deep linking is trivial - Since state is a function of location, you can use a URL to generate an identical router state tree on any platform |
| 😱 | Opinionated and automatic URL construction - There is no need to think about matching path names or constructing search params. The URL is simply a namespace for the state tree |
| 🍬 | Small size - The only peer dependency is MobX and this will likely be removed in V1 release |
| 🚀 | Reactive - Subscribe to the state of any router in the router state tree |
| 👌 | Simple - Declare the route tree using a small but expressive syntax set |

If you dislike how much ceremony is around configuring a router, then this library may be something that interests you!

## Here's how it works:
1. Recursive router treats the URL as a namespace for the storage of a state tree which represents all routable state. 
2. Writing to the URL is handled by the router
3. Any changes to the URL are reduced over the router state tree
4. Various types of routers in the router state tree exist. The differences are used to control how their state and their childrens state will get updated when the URL changes.
5. Once the router state tree has been updated, observers of updated routers are notified.


## How do I use this router?

Simple! 

#### 1. Define a router tree representing what the routing logic of your app should look like in terms of `Stack`, `Scene`, `Feature`, and `Data` routers.
```
const tree =
  { name: 'root',
    routers: {
      scene: [
        { name: 'doc' routers: { feature: [{ name: 'doc-nav' }], stack: [{ name: 'doc-intro' }], },
        { name: 'main', default: { visible: true } }},
      ],
    },
  }
```

#### 2. Register the router tree
```
{ registerRouter } from 'recursive-router';

const routers = registerRouter(tree);
```

#### 3. Observe when the routers have changed via the power of mobx

```
<App>
 { routers['doc-nav'] && <DocNav /> }
</App>
```

## Router types

Almost all routeable and dynamic apps can be expressed in terms of the 4 main router types: `Stack`, `Scene`, `Feature`, and `Data`. Router types simply control how information is serialized into the URL and how their children respond when such corresponding information changes. 


#### `Stack` router
`Stack` router is how you would control modals or multiple components that you want to exist at the same time but have some cardinality to them. You can use a stack router to control the immediate ordering of multiple child routers. 

```
  <StackRouter>
  <Modal1><Modal2><Modal3>
```

In this case, a `Stack` router would control which modal was showing. If multiple modals were showing it would control the `ordering` of them via a data key. A url with this type of routing, where only `Modal1` and `Modal2` are visible may look like:  `http://<something>/stack1?modal1=1&modal2=0`

##### Methods:

```
#show
#hide
#toFront
#toBack
#forward
#backward
```

#### `Scene` router
`Scene` router is how you make sure only one child is showing at a time, if at all. If a child becomes visible, the other children will be hidden.

Ex URL: `http://<something>scene1/stack1/scene2?modal1=1&modal2=0`

##### Methods:

```
#show
#hide
```

#### `Feature` router
`Feature` router is similar to a `Stack` router except there is no cardinality among the children. Either some of the children are showing or they are not. This is desireable if you want to control the presence of a feature in a boolean way. Ulitmately, this type of router can allow for more concise URL construction over what a `Stack` router would be capapble of.

Ex URL: `http://<something>scene1/stack1/scene2?modal1=1&modal2=0&feature1&feature2`

##### Methods:

```
#show
#hide
```

#### `Data` router
`Data` router is how you store arbitrary data in the URL. Arguably, everything could be a `Data` router but you would loose out on all the convenience features that make each router unique and, thus, have to reimplement all the logic that this library is trying to abstract away. A data router primarily handles storing data like redirect URLs or page numbers.

Ex URL: `http://<something>scene1/stack1/scene2/99?modal1=1&modal2=0&feature1=true` For when we are at page 99 of scene2.

##### Methods:

```
#show
#hide
#setData
```

## Things to know:

##### Pathname vs Search params

A given router will store its information in the pathname if all parent routers up to the root are either `Scene` or `Data` routers.


##### Rehydration of state after visibility change

All routers will by default rehydrate their branch back to how it was when they were visible. The exception to this is if a child in the branch had their state updated while said router was hidden. This setting can be overridden on a case-by-case basis during the router tree declaration. 


## V1 Roadmap

- Finish playground 
- Demos of common apps built with `recursive-router`
- Add `redux` and `react` bindings
- Clean up code and remove dependency on mobx
- Add tests
- Add docs and a better README