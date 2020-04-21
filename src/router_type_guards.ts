import {RouterInstance, IRouterTemplates} from './types';

export const isStackRouter = <Templates extends IRouterTemplates<unknown, null>>(
    router: RouterInstance<Templates> | RouterInstance<Templates, 'stack'>
): router is RouterInstance<Templates, 'stack'> => {
    const r = router as RouterInstance<Templates, 'stack'>;
    return r.type === 'stack';
};

export const isDataRouter = <Templates extends IRouterTemplates>(
    router: RouterInstance<Templates> | RouterInstance<Templates, 'data'>
): router is RouterInstance<Templates, 'data'> => {
    const r = router as RouterInstance<Templates, 'data'>;
    return r.type === 'data';
};

export const isSceneRouter = <Templates extends IRouterTemplates>(
    router: RouterInstance<Templates> | RouterInstance<Templates, 'scene'>
): router is RouterInstance<Templates, 'scene'> => {
    const r = router as RouterInstance<Templates, 'scene'>;
    return r.type === 'scene';
};

export const isFeatureRouter = <Templates extends IRouterTemplates>(
    router: RouterInstance<Templates> | RouterInstance<Templates, 'feature'>
): router is RouterInstance<Templates, 'feature'> => {
    const r = router as RouterInstance<Templates, 'feature'>;
    return r.type === 'feature';
};
