/**
 * Utility to correctly extract keys from an object without loosing typing.
 *
 */

// import {RouterInstance, AllTemplates} from './types';

// eslint-disable-next-line
export const objKeys = <T extends {}>(o: T): Array<keyof T> => <Array<keyof T>>Object.keys(o);

// export const stack = {
//     isIncreasing: (router: RouterInstance<AllTemplates, 'stack'>) => {
//         return (router.state.actionCount === router.manager.actionCount &&
//             router.state.order > router.history[1].order && router.state.visible)
//     },
//     isDecreasing: (router: RouterInstance<AllTemplates, 'stack'>) => {
//         return (router.state.actionCount === router.manager.actionCount &&
//             router.state.order < router.history[1].order && router.state.visible)
//     },
//     isPositionSame: (router: RouterInstance<AllTemplates, 'stack'>) => {
//         return (router.state.actionCount !== router.manager.actionCount &&
//             router.state.visible)
//     };
//     isGreatestOrder: () => {},
//     isSmallestOrder: () => {},

// };

// const AnimatedStackRouter = createRouterAnimation([
//     action(isIncreasing, (uuid) => anime({ target: uuid, translateX: 250 }),

// ])
// <StackRouter>
//     {({router}) =>
//     <AnimatedStackRouter router={router} >
//         {({uuid}) =>
//            <Feature id={uuid} />
//         }
//     </AnimatedStackRouter>
//     }
// </StackRouter>

// <StackRouter>
//     <AnimatedStackRouter>
//         {({uuid}) =>
//            <Feature id={uuid} />
//         }
//     </AnimatedStackRouter>
// </StackRouter>
