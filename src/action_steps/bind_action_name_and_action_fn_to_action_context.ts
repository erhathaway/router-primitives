import {ActionStep, RouterActionFn} from '../types';

type Fn = ({actionName, actionFn}: {actionName: string; actionFn: RouterActionFn}) => ActionStep;

const bindActionNameAndActionFnToActionContext: Fn = ({actionName, actionFn}) => (
    _options,
    existingLocation,
    _routerInstance,
    ctx
) => {
    return {location: existingLocation, ctx: {...ctx, actionName, actionFn}};
};

export default bindActionNameAndActionFnToActionContext;
