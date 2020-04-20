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
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                expect(isVisible(routerA)).toBeTruthy();
                            });

                            it('is true when visible', () => {
                                const manager = new Manager({
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];
                                if (routerB.config.isDependentOnExternalData) {
                                    routerB.show({data: 'hello'});
                                } else {
                                    routerB.show();
                                }

                                expect(isVisible(routerB)).toBeTruthy();
                            });

                            it('is false when hidden', () => {
                                const manager = new Manager({
                                    routerTree: routerDeclaration,
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

                                expect(isVisible(routerB)).toBeFalsy();
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
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                expect(isHidden(routerA)).toBeFalsy();
                            });

                            it('is false when visible', () => {
                                const manager = new Manager({
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];
                                if (routerB.config.isDependentOnExternalData) {
                                    routerB.show({data: 'hello'});
                                } else {
                                    routerB.show();
                                }

                                expect(isHidden(routerB)).toBeFalsy();
                            });

                            it('is true when hidden', () => {
                                const manager = new Manager({
                                    routerTree: routerDeclaration,
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

                                expect(isHidden(routerB)).toBeTruthy();
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
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                expect(isJustHidden(routerA)).toBeFalsy();
                            });

                            it('is false when visible', () => {
                                const manager = new Manager({
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];
                                if (routerB.config.isDependentOnExternalData) {
                                    routerB.show({data: 'hello'});
                                } else {
                                    routerB.show();
                                }

                                expect(isJustHidden(routerB)).toBeFalsy();
                            });

                            it('is false when hidden but not just hidden', () => {
                                const manager = new Manager({
                                    routerTree: routerDeclaration,
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

                                expect(isJustHidden(routerB)).toBeFalsy();
                            });

                            it('is true when just hidden', () => {
                                const manager = new Manager({
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];

                                if (routerB.config.isDependentOnExternalData) {
                                    routerB.show({data: 'hello'});
                                } else {
                                    routerB.show();
                                }
                                routerB.hide();

                                expect(isJustHidden(routerB)).toBeTruthy();
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
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                expect(isJustShown(routerA)).toBeTruthy();
                            });

                            it('is false when hidden', () => {
                                const manager = new Manager({
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];
                                if (routerB.config.isDependentOnExternalData) {
                                    routerB.show({data: 'hello'});
                                } else {
                                    routerB.show();
                                }

                                routerB.hide();

                                expect(isJustShown(routerB)).toBeFalsy();
                            });

                            // TODO figure out test for this
                            // it.todo('is false when shown but not just shown');

                            it('is true when just shown', () => {
                                const manager = new Manager({
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];

                                routerB.hide();

                                if (routerB.config.isDependentOnExternalData) {
                                    routerB.show({data: 'hello'});
                                } else {
                                    routerB.show();
                                }

                                expect(isJustShown(routerB)).toBeTruthy();
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
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                expect(isFirstTimeBeingShown(routerA)).toBeTruthy();
                            });

                            it('is false if shown before', () => {
                                if (templateName === 'data') {
                                    routerDeclaration = createRouterDeclaration(
                                        templateName,
                                        'hello'
                                    );
                                }
                                const manager = new Manager({
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                routerA.hide();
                                routerA.show();

                                expect(isFirstTimeBeingShown(routerA)).toBeFalsy();
                            });

                            it('is false if hidden', () => {
                                if (templateName === 'data') {
                                    routerDeclaration = createRouterDeclaration(
                                        templateName,
                                        'hello'
                                    );
                                }
                                const manager = new Manager({
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];

                                expect(isFirstTimeBeingShown(routerB)).toBeFalsy();
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
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                expect(hasBeenShownBefore(routerA)).toBeFalsy();
                            });

                            it('is true if shown before', () => {
                                if (templateName === 'data') {
                                    routerDeclaration = createRouterDeclaration(
                                        templateName,
                                        'hello'
                                    );
                                }
                                const manager = new Manager({
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerA = manager.routers['a'];

                                routerA.hide();
                                routerA.show();

                                expect(hasBeenShownBefore(routerA)).toBeTruthy();
                            });

                            it('is false if hidden', () => {
                                if (templateName === 'data') {
                                    routerDeclaration = createRouterDeclaration(
                                        templateName,
                                        'hello'
                                    );
                                }
                                const manager = new Manager({
                                    routerTree: routerDeclaration,
                                    errorWhenMissingData: false
                                });
                                const routerB = manager.routers['b'];

                                expect(hasBeenShownBefore(routerB)).toBeFalsy();
                            });
                        });
                    });
                });
        });
    });
});
