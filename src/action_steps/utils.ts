import {
    IRouterTemplates,
    AllTemplates,
    RouterInstance,
    ILocationActionContext,
    NarrowRouterTypeName,
    ILocationOptions
} from '../types';

/**
 * Intended for passing context to children. Looks to see:
 * 1. If the declaration for this router specifies the disableCaching flag
 * 2. If inherited context set the disableCaching flag
 * 3. If the closet parent with the flag set has it set to true
 */
export const addRealDisableCacheFlagToContext = <
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
>(
    router: RouterInstance<CustomTemplates, Name>,
    ctx: ILocationActionContext<CustomTemplates, Name>
): ILocationActionContext<CustomTemplates, Name> => {
    // Figure out if caching should occur:
    // If the user hasn't set anything, we should fall back to the
    // context object and inherit the setting from the parent.
    // If the parent hasn't set a setting we are probably at root of the action call
    // and should fall back to using the template.
    const disableCaching =
        router.config.disableCaching !== undefined
            ? router.config.disableCaching
            : ctx.disableCaching || router.lastDefinedParentsDisableChildCacheState || false;

    const hasChildren =
        router.routers &&
        Object.values(router.routers).reduce(
            (childrenExist, children) => (children.length && children.length > 0) || childrenExist,
            false
        );
    if (hasChildren) {
        ctx.tracer &&
            ctx.tracer.logStep(
                `Passing to children the ctx state: 'disableCaching' = ${disableCaching}`,
                {disableCaching}
            );
    }
    return {...ctx, disableCaching};
};

export const calculateIfShouldUseCache = <
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
>(
    ctx: ILocationActionContext<CustomTemplates, Name>,
    _options: ILocationOptions
): boolean => {
    return !ctx.disableCaching;
};
