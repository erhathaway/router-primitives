import {ActionStep} from '../types';

const validateExistenceOfData: ActionStep = (_options, location, router, ctx) => {
    if (ctx.actionName === 'show' && router.config.isDependentOnExternalData) {
        const hasData = (ctx.pathData && ctx.pathData[router.name]) || router.data;
        if (!hasData) {
            if (router.manager.errorWhenMissingData) {
                throw new Error(
                    `Router ${router.name} is missing data. Set data by calling the router action with the 'data' or 'pathData' kwarg. For example: '<router>.show({data: 'hello world'})'`
                );
            }
            return {
                location,
                ctx: {
                    ...ctx,
                    routerIsMissingData: [...((ctx || {}).routerIsMissingData || []), router.name]
                }
            };
        }
    }

    return {location, ctx};
};

export default validateExistenceOfData;
