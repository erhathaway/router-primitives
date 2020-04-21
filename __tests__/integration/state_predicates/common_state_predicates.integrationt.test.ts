import {
    IRouterDeclaration,
    AllTemplates,
    Manager,
    statePredicates,
    defaultTemplates
} from '../../../src';
import {objKeys} from '../../../src/utilities';

const createRouterDeclaration = (
    routerType: string,
    defaultShowData?: any // eslint-disable-line
): IRouterDeclaration<AllTemplates> => ({
    name: 'root',
    routers: {
        [routerType]: [
            {name: 'a', defaultAction: defaultShowData ? ['show', defaultShowData] : ['show']},
            {name: 'b'},
            {name: 'c'},
            {name: 'd'}
        ]
    }
});

const {
    isVisible,
    isHidden,
    isJustHidden,
    isJustShown,
    isFirstTimeBeingShown,
    hasBeenShownBefore
} = statePredicates;

describe('Integration', () => {
    describe('State Predicates', () => {
        describe('Common', () => {
            objKeys(defaultTemplates)
                .filter(t => t !== 'root')
                .forEach(templateName => {
                    let routerDeclaration = createRouterDeclaration(templateName);
                    describe(templateName, () => {
                        describe('isVisible', () => {
                            it('is false on defaultAction show', () => {
                                if (templateName === 'data') {
                                    routerDeclaration = createRouterDeclaration(
                                        templateName,
                                        'hello'
                                    );
                                }
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                expect(isVisible(routerA as any)).toBeTruthy();
                            });

                            it('is true when visible', () => {
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];
                                if (routerB.config.isDependentOnExternalData) {
                                    routerB.show({data: 'hello'});
                                } else {
                                    routerB.show();
                                }

                                expect(isVisible(routerB as any)).toBeTruthy();
                            });

                            it('is false when hidden', () => {
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];
                                const routerC = manager.routers['c'];

                                if (routerB.config.isDependentOnExternalData) {
                                    routerB.show({data: 'hello'});
                                } else {
                                    routerB.show();
                                }
                                routerB.hide();
                                routerC.hide();

                                expect(isVisible(routerB as any)).toBeFalsy();
                            });
                        });
                        describe('isHidden', () => {
                            it('is false on defaultAction show', () => {
                                if (templateName === 'data') {
                                    routerDeclaration = createRouterDeclaration(
                                        templateName,
                                        'hello'
                                    );
                                }
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                expect(isHidden(routerA as any)).toBeFalsy();
                            });

                            it('is false when visible', () => {
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];
                                if (routerB.config.isDependentOnExternalData) {
                                    routerB.show({data: 'hello'});
                                } else {
                                    routerB.show();
                                }

                                expect(isHidden(routerB as any)).toBeFalsy();
                            });

                            it('is true when hidden', () => {
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];
                                const routerC = manager.routers['c'];

                                if (routerB.config.isDependentOnExternalData) {
                                    routerB.show({data: 'hello'});
                                } else {
                                    routerB.show();
                                }
                                routerB.hide();
                                routerC.hide();

                                expect(isHidden(routerB as any)).toBeTruthy();
                            });
                        });

                        describe('isJustHidden', () => {
                            it('is false on defaultAction show', () => {
                                if (templateName === 'data') {
                                    routerDeclaration = createRouterDeclaration(
                                        templateName,
                                        'hello'
                                    );
                                }
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                expect(isJustHidden(routerA as any)).toBeFalsy();
                            });

                            it('is false when visible', () => {
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];
                                if (routerB.config.isDependentOnExternalData) {
                                    routerB.show({data: 'hello'});
                                } else {
                                    routerB.show();
                                }

                                expect(isJustHidden(routerB as any)).toBeFalsy();
                            });

                            it('is false when hidden but not just hidden', () => {
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];
                                const routerA = manager.routers['a'];

                                if (routerB.config.isDependentOnExternalData) {
                                    routerB.show({data: 'hello'});
                                } else {
                                    routerB.show();
                                }
                                routerB.hide();
                                routerA.hide();

                                expect(isJustHidden(routerB as any)).toBeFalsy();
                            });

                            it('is true when just hidden', () => {
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];

                                if (routerB.config.isDependentOnExternalData) {
                                    routerB.show({data: 'hello'});
                                } else {
                                    routerB.show();
                                }
                                routerB.hide();

                                expect(isJustHidden(routerB as any)).toBeTruthy();
                            });
                        });

                        describe('isJustShown', () => {
                            it('is true on defaultAction show', () => {
                                if (templateName === 'data') {
                                    routerDeclaration = createRouterDeclaration(
                                        templateName,
                                        'hello'
                                    );
                                }
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                expect(isJustShown(routerA as any)).toBeTruthy();
                            });

                            it('is false when hidden', () => {
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];
                                if (routerB.config.isDependentOnExternalData) {
                                    routerB.show({data: 'hello'});
                                } else {
                                    routerB.show();
                                }

                                routerB.hide();

                                expect(isJustShown(routerB as any)).toBeFalsy();
                            });

                            // TODO figure out test for this
                            // it.todo('is false when shown but not just shown');

                            it('is true when just shown', () => {
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];

                                routerB.hide();

                                if (routerB.config.isDependentOnExternalData) {
                                    routerB.show({data: 'hello'});
                                } else {
                                    routerB.show();
                                }

                                expect(isJustShown(routerB as any)).toBeTruthy();
                            });
                        });

                        describe('isFirstTimeBeingShown', () => {
                            it('is true on defaultAction show', () => {
                                if (templateName === 'data') {
                                    routerDeclaration = createRouterDeclaration(
                                        templateName,
                                        'hello'
                                    );
                                }
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                expect(isFirstTimeBeingShown(routerA as any)).toBeTruthy();
                            });

                            it('is false if shown before', () => {
                                if (templateName === 'data') {
                                    routerDeclaration = createRouterDeclaration(
                                        templateName,
                                        'hello'
                                    );
                                }
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                routerA.hide();
                                routerA.show();

                                expect(isFirstTimeBeingShown(routerA as any)).toBeFalsy();
                            });

                            it('is false if hidden', () => {
                                if (templateName === 'data') {
                                    routerDeclaration = createRouterDeclaration(
                                        templateName,
                                        'hello'
                                    );
                                }
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];

                                expect(isFirstTimeBeingShown(routerB as any)).toBeFalsy();
                            });
                        });

                        describe('hasBeenShownBefore', () => {
                            it('is false on defaultAction show', () => {
                                if (templateName === 'data') {
                                    routerDeclaration = createRouterDeclaration(
                                        templateName,
                                        'hello'
                                    );
                                }
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                expect(hasBeenShownBefore(routerA as any)).toBeFalsy();
                            });

                            it('is true if shown before', () => {
                                if (templateName === 'data') {
                                    routerDeclaration = createRouterDeclaration(
                                        templateName,
                                        'hello'
                                    );
                                }
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                routerA.hide();
                                routerA.show();

                                expect(hasBeenShownBefore(routerA as any)).toBeTruthy();
                            });

                            it('is false if hidden', () => {
                                if (templateName === 'data') {
                                    routerDeclaration = createRouterDeclaration(
                                        templateName,
                                        'hello'
                                    );
                                }
                                const manager = new Manager({
                                    routerDeclaration: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];

                                expect(hasBeenShownBefore(routerB as any)).toBeFalsy();
                            });
                        });
                    });
                });
        });
    });
});
