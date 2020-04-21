import {
    IRouterDeclaration,
    AllTemplates,
    Manager,
    statePredicates,
    isStackRouter
} from '../../../src';
const routerDeclaration: IRouterDeclaration<AllTemplates> = {
    name: 'root',
    routers: {
        stack: [{name: 'a', defaultAction: ['show']}, {name: 'b'}, {name: 'c'}, {name: 'd'}]
    }
};

const {stack} = statePredicates;

describe('Integration', () => {
    describe('State Predicates', () => {
        describe('Stack', () => {
            describe('isMovingForward', () => {
                it('is false on defaultActions', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    if (!isStackRouter(routerA)) {
                        throw new Error('Wrong router type');
                    }

                    expect(stack.isMovingForward(routerA)).toBeFalsy();
                });
                it('is false on hiding', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    if (!isStackRouter(routerA)) {
                        throw new Error('Wrong router type');
                    }
                    routerA.hide();

                    expect(stack.isMovingForward(routerA)).toBeFalsy();
                });
                it('is true when decrementing (moving forward)', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];

                    if (!isStackRouter(routerA) || !isStackRouter(routerB)) {
                        throw new Error('Wrong router type');
                    }

                    routerB.show();
                    routerA.toFront();

                    expect(stack.isMovingForward(routerA)).toBeTruthy();
                });
                it('is false when incrementing (moving backwards)', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];

                    if (!isStackRouter(routerA) || !isStackRouter(routerB)) {
                        throw new Error('Wrong router type');
                    }

                    routerB.show();
                    routerA.toFront();
                    routerA.backward();

                    expect(stack.isMovingForward(routerA)).toBeFalsy();
                });
            });
            describe('isMovingBackward', () => {
                it('is false on defaultActions', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    if (!isStackRouter(routerA)) {
                        throw new Error('Wrong router type');
                    }

                    expect(stack.isMovingBackward(routerA)).toBeFalsy();
                });
                it('is false on hiding', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    if (!isStackRouter(routerA)) {
                        throw new Error('Wrong router type');
                    }
                    routerA.hide();

                    expect(stack.isMovingBackward(routerA)).toBeFalsy();
                });
                it('is false when decrementing (moving forward)', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];

                    if (!isStackRouter(routerA) || !isStackRouter(routerB)) {
                        throw new Error('Wrong router type');
                    }

                    routerB.show();
                    routerA.toFront();

                    expect(stack.isMovingBackward(routerA)).toBeFalsy();
                });
                it('is true when incrementing (moving backwards)', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];

                    if (!isStackRouter(routerA) || !isStackRouter(routerB)) {
                        throw new Error('Wrong router type');
                    }

                    routerB.show();
                    routerA.toFront();
                    routerA.backward();

                    expect(stack.isMovingBackward(routerA)).toBeTruthy();
                });
            });
            describe('isAtFront', () => {
                it('is false when in the middle', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];
                    const routerC = manager.routers['c'];

                    if (
                        !isStackRouter(routerA) ||
                        !isStackRouter(routerB) ||
                        !isStackRouter(routerC)
                    ) {
                        throw new Error('Wrong router type');
                    }

                    routerB.show();
                    routerC.toBack();

                    expect(stack.isAtFront(routerA)).toBeFalsy();
                });
                it('is false when in the back', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];

                    if (!isStackRouter(routerA) || !isStackRouter(routerB)) {
                        throw new Error('Wrong router type');
                    }

                    routerB.show();

                    expect(stack.isAtFront(routerA)).toBeFalsy();
                });
                it('is true when in the front', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];

                    if (!isStackRouter(routerA) || !isStackRouter(routerB)) {
                        throw new Error('Wrong router type');
                    }

                    expect(stack.isAtFront(routerA)).toBeTruthy();

                    routerB.show();

                    expect(stack.isAtFront(routerB)).toBeTruthy();
                });
            });
            describe('isAtBack', () => {
                it('is false when in the middle', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];
                    const routerC = manager.routers['c'];

                    if (
                        !isStackRouter(routerA) ||
                        !isStackRouter(routerB) ||
                        !isStackRouter(routerC)
                    ) {
                        throw new Error('Wrong router type');
                    }

                    routerB.show();
                    routerC.toBack();

                    expect(stack.isAtBack(routerA)).toBeFalsy();
                });
                it('is false when in the front', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];

                    if (!isStackRouter(routerA) || !isStackRouter(routerB)) {
                        throw new Error('Wrong router type');
                    }

                    expect(stack.isAtBack(routerA)).toBeFalsy();
                });
                it('is true when in the back', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];
                    const routerC = manager.routers['c'];

                    if (
                        !isStackRouter(routerA) ||
                        !isStackRouter(routerB) ||
                        !isStackRouter(routerC)
                    ) {
                        throw new Error('Wrong router type');
                    }

                    routerB.show();

                    expect(stack.isAtBack(routerA)).toBeTruthy();

                    routerC.show();

                    expect(stack.isAtBack(routerA)).toBeTruthy();
                });
            });
            describe('isPositionSameAsLastTimeShown', () => {
                it('is false when showing in a different position', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];
                    const routerC = manager.routers['c'];

                    if (
                        !isStackRouter(routerA) ||
                        !isStackRouter(routerB) ||
                        !isStackRouter(routerC)
                    ) {
                        throw new Error('Wrong router type');
                    }

                    routerA.hide();
                    routerB.show();
                    routerA.toBack();

                    expect(stack.isPositionSameAsLastTimeShown(routerA)).toBeFalsy();
                });
                it('is false when show is by a default action', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];
                    const routerC = manager.routers['c'];

                    if (
                        !isStackRouter(routerA) ||
                        !isStackRouter(routerB) ||
                        !isStackRouter(routerC)
                    ) {
                        throw new Error('Wrong router type');
                    }

                    expect(stack.isPositionSameAsLastTimeShown(routerA)).toBeFalsy();
                });
                it('is true when showing in the same position as last time visible', () => {
                    const manager = new Manager({
                        routerDeclaration: routerDeclaration,
                        errorWhenMissingData: false
                    });
                    const routerA = manager.routers['a'];
                    const routerB = manager.routers['b'];
                    const routerC = manager.routers['c'];

                    if (
                        !isStackRouter(routerA) ||
                        !isStackRouter(routerB) ||
                        !isStackRouter(routerC)
                    ) {
                        throw new Error('Wrong router type');
                    }

                    routerA.hide();
                    routerA.show();

                    expect(stack.isPositionSameAsLastTimeShown(routerA)).toBeTruthy();

                    routerB.show();
                    routerA.hide();
                    routerA.toBack();

                    expect(stack.isPositionSameAsLastTimeShown(routerA)).toBeTruthy();
                });
            });
        });
    });
});
