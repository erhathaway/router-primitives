import { RouterAction, RouterReducer } from "../../types";
declare const stack: {
    actions: {
        show: RouterAction;
        hide: RouterAction;
        forward: RouterAction;
        backward: RouterAction;
        toFront: RouterAction;
        toBack: RouterAction;
    };
    reducer: RouterReducer;
};
export default stack;
