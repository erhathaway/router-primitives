import {RouterInstance, AllTemplates} from './types';

const stack = {
    isMovingForward: (router: RouterInstance<AllTemplates, 'stack'>) => {
        return (
            router.state.actionCount === router.manager.actionCount &&
            router.history.length > 0 &&
            router.state.data < router.history[0].data &&
            router.history[0].visible === true &&
            router.state.visible
        );
    },
    isMovingBackward: (router: RouterInstance<AllTemplates, 'stack'>) => {
        return (
            router.state.actionCount === router.manager.actionCount &&
            router.history.length > 0 &&
            router.state.data > router.history[0].data &&
            router.history[0].visible === true &&
            router.state.visible
        );
    },
    isAtFront: (router: RouterInstance<AllTemplates, 'stack'>) => {
        return router.state.data === 1 && router.state.visible;
    },
    isAtBack: (router: RouterInstance<AllTemplates, 'stack'>) => {
        return (
            router.state.visible &&
            router.siblings.filter(s => s.state.visible === true).length > 0 && // when there are other stacks being shown
            router.state.data === router.siblings.filter(s => s.state.visible === true).length + 1 // add 1 to include this router since siblings are 'all but this'
        );
    },
    isPositionSameAsLastTimeShown: (router: RouterInstance<AllTemplates, 'stack'>) => {
        return (
            router.state.visible &&
            router.state.data === (router.history.find(s => s.visible === true) || {}).data
        );
    }
};

const scene = {
    isVisibleSiblingsFirstTimeBeingShown: (router: RouterInstance<AllTemplates, 'scene'>) => {
        const visibleSibling = router.siblings.find(s => s.state.visible === true);
        return (
            router.state.visible === false &&
            visibleSibling &&
            visibleSibling.history.find(h => h.visible === true) === undefined
        );
    },
    hasVisibleSiblingBeenShownBefore: (router: RouterInstance<AllTemplates, 'scene'>) => {
        const visibleSibling = router.siblings.find(s => s.state.visible === true);
        return (
            router.state.visible === false &&
            visibleSibling &&
            visibleSibling.history.find(h => h.visible === true) !== undefined
        );
    }
};

export default {
    stack,
    scene
};
