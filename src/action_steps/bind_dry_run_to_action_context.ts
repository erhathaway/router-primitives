import {ActionStep} from '../types';

const bindDryRunToActionContext: ActionStep = (options, existingLocation, _routerInstance, ctx) => {
    return {location: existingLocation, ctx: {...ctx, dryRun: options.dryRun}};
};

export default bindDryRunToActionContext;
