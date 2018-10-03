import Router, { registerRouter, initalizeRouter } from 'recursive-router';

// const docModal = new Router({
//   name: 'docModal',
//   routeKey: 'docModal',
// })
//
// const docPage = new Router({
//   name: 'docPage',
//   routeKey: 'docPage',
//   routers: {
//     stack: [docModal],
//   },
// })
//
// const docMenu = new Router({
//   name: 'docMenu',
//   routeKey: 'docMenu',
// })
//
// const doc = new Router({
//   name: 'doc',
//   routeKey: 'doc',
//   routers: {
//     stack: [docMenu],
//     page: [docPage],
//   },
// })
//
//
//
//
// const intro = new Router({
//   name: 'intro',
//   routeKey: 'intro',
// })
//
// const share = new Router({
//   name: 'share',
//   routeKey: 'share',
// })
//
// const view = new Router({
//   name: 'view',
//   routeKey: 'view',
//   routers: {
//     feature: [share]
//   }
// })
//
//
// const home = new Router({
//   name: 'home',
//   routeKey: 'home',
// })
//
// const root = new Router({
//   name: 'root',
//   routeKey: 'home',
//   routers: {
//     stack: [doc, intro],
//     scene: [view, home],
//     feature: [],
//     page: [],
//   },
//   // defaultRouters: {
//   //   stack: doc,
//   //   scene: view,
//   // },
//   hooks: {
//     before: [() => console.log('before hook hit')],
//     after: [(loc, ctx) => console.log('after hook hit', loc, ctx)],
//   },
//   error: [],
// })

const config =
  { name: 'root',
    // beforeLocationUpdate: fn,
    // afterLocationUpdate: fn,
    // beforeStateUpdate: fn,
    // afterStateUpdate: fn,
    routers: {
    stack: [
      { name: 'doc', default: { visible: true }, routers: {
        scene: [{ name: 'hi' }, { name: 'hello' }],
        page: [],
      }},
      { name: 'intro' },
      { name: 'otherStack' },
    ],
    data: [
      { name: 'imData',
        state: { data: 'hello-im-some-data'},
        routers: {
          data: [
            { name: 'imData2',
              state: { data: 'moar data'},
              isPathRouter: false,
            }
          ],
        }
      }
    ],
    scene: [
      { name: 'view', routers: {
        feature: [
          { name: 'share' },
          { name: 'otherFeature'}
        ],
        scene: [
          { name: 'oScene', routeKey: 'a'}
        ]
      }},
      { name: 'otherView' }
    ],
  }};

const routers = initalizeRouter(config)
const root = routers['root'];
registerRouter(root);

export {
  root,
  routers,
}
