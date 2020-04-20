import {ActionStep, RouterActionFn} from '../types';

type Fn = ({
    actionName,
    actionFn
}: {
    actionName: string;
    actionFn: RouterActionFn<any, any>;
}) => ActionStep;

const bindActionNameAndActionFnToActionContext: Fn = ({actionName, actionFn}) => (
    _options,
    existingLocation,
    routerInstance,
    ctx
) => {
    // TODO fix actionFn any type
    return {location: existingLocation, ctx: {...ctx, actionName, actionFn}};
};

export default bindActionNameAndActionFnToActionContext;
