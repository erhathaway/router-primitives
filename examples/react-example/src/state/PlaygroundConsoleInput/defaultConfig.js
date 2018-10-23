export default { name: 'root',
  routers: {
  stack: [
    { name: 'doc', default: { visible: true }, rehydrateChildRoutersState: true, routers: {
      scene: [{ name: 'hi' }, { name: 'hello' }],
      page: [],
    }},
    { name: 'intro' },
    { name: 'otherStack' },
  ],
  data: [
    { name: 'imData',
      state: { data: 'hello-im-some-data'},
      isPathRouter: false,
      rehydrateChildRoutersState: true,
      routers: {
        stack: [
          // { name: 'd1' },
        ],
        data: [
          { name: 'imData2',
            state: { data: 'moar-data'},
            isPathRouter: false,
          }
        ],
      }
    }
  ],
  scene: [
    { name: 'view',
      rehydrateChildRoutersState: true,
      routers: {
        feature: [
          { name: 'share' },
          { name: 'otherFeature'}
        ],
        scene: [
          { name: 'oScene'}
        ]
      }},
    { name: 'otherView' }
  ],
}};
