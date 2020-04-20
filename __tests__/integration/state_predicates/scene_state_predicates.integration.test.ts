import {
    IRouterDeclaration,
    AllTemplates,
    Manager,
    statePredicates,
    isSceneRouter
} from '../../../src';
const routerDeclaration: IRouterDeclaration<AllTemplates> = {
    name: 'root',
    routers: {
        scene: [{name: 'a', defaultAction: ['show']}, {name: 'b'}, {name: 'c'}, {name: 'd'}]
    }
};

const {scene} = statePredicates;

describe('Integration', () => {
    describe('State Predicates', () => {
        describe('Scene', () => {
            describe('isVisibleSiblingsFirstTimeBeingShown', () => {
                it('is false on defaultActions', () => {
                    const manager = new Manager({
                        routerTree: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    if (!isSceneRouter(routerA)) {
                        throw new Error('Wrong router type');
                    }

                    expect(scene.isVisibleSiblingsFirstTimeBeingShown(routerA)).toBeFalsy();
                });
                it('is false if sibling has been shown before', () => {
                    const manager = new Manager({
                        routerTree: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];

                    if (!isSceneRouter(routerA) || !isSceneRouter(routerB)) {
                        throw new Error('Wrong router type');
                    }

                    routerB.show();
                    routerA.show();
                    routerB.show();

                    expect(scene.isVisibleSiblingsFirstTimeBeingShown(routerA)).toBeFalsy();
                });
                it('is true if sibling has never been shown before', () => {
                    const manager = new Manager({
                        routerTree: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];

                    if (!isSceneRouter(routerA) || !isSceneRouter(routerB)) {
                        throw new Error('Wrong router type');
                    }

                    routerB.show();

                    expect(scene.isVisibleSiblingsFirstTimeBeingShown(routerA)).toBeTruthy();
                });
            });
            describe('hasVisibleSiblingBeenShownBefore', () => {
                it('is false on defaultActions', () => {
                    const manager = new Manager({
                        routerTree: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    if (!isSceneRouter(routerA)) {
                        throw new Error('Wrong router type');
                    }

                    expect(scene.hasVisibleSiblingBeenShownBefore(routerA)).toBeFalsy();
                });
                it('is true if sibling has been shown before', () => {
                    const manager = new Manager({
                        routerTree: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];

                    if (!isSceneRouter(routerA) || !isSceneRouter(routerB)) {
                        throw new Error('Wrong router type');
                    }

                    routerB.show();
                    routerA.show();
                    routerB.show();

                    expect(scene.hasVisibleSiblingBeenShownBefore(routerA)).toBeTruthy();
                });
                it('is false if sibling has never been shown before', () => {
                    const manager = new Manager({
                        routerTree: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];

                    if (!isSceneRouter(routerA) || !isSceneRouter(routerB)) {
                        throw new Error('Wrong router type');
                    }

                    routerB.show();

                    expect(scene.hasVisibleSiblingBeenShownBefore(routerA)).toBeFalsy();
                });
            });
        });
    });
});
