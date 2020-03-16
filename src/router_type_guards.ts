import {RouterInstance, AllTemplates, IRouterTemplates} from './types';

export const isStackRouter = <Templates extends IRouterTemplates>(
    router: RouterInstance<Templates> | RouterInstance<AllTemplates, 'stack'>
): router is RouterInstance<AllTemplates, 'stack'> => {
    const r = router as RouterInstance<AllTemplates, 'stack'>;
    return (
        r.toBack !== undefined &&
        r.toFront !== undefined &&
        r.forward !== undefined &&
        r.backward !== undefined
    );
};

export const isDataRouter = <Templates extends IRouterTemplates>(
    router: RouterInstance<Templates> | RouterInstance<AllTemplates, 'data'>
): router is RouterInstance<AllTemplates, 'data'> => {
    const r = router as RouterInstance<AllTemplates, 'data'>;
    return r.setData !== undefined;
};
