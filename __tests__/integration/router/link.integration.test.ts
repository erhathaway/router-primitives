import {defaultTemplates, Manager, IRouterDeclaration, AllTemplates} from '../../../src';
import {objKeys} from '../../../src/utilities';

const createRouterDeclaration = (
    routerType: string,
    defaultShowData?: any // eslint-disable-line
): IRouterDeclaration<AllTemplates> => ({
    name: 'root',
    children: {
        [routerType]: [
            {name: 'a', defaultAction: defaultShowData ? ['show', defaultShowData] : ['show']},
            {name: 'b'},
            {name: 'c'},
            {name: 'd'}
        ]
    }
});

describe('Integration', () => {
    describe('Router', () => {
        describe('link', () => {
            objKeys(defaultTemplates)
                .filter(t => t !== 'root')
                .forEach(templateName => {
                    let routerDeclaration = createRouterDeclaration(templateName);
                    describe(templateName, () => {
                        describe('link to show and hide', () => {
                            it('returns a link', () => {
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

                                const showLink = routerA.link('show');
                                expect(typeof showLink).toMatch('string');

                                const hideLink = routerA.link('hide');
                                expect(typeof hideLink).toMatch('string');
                            });

                            it('can pass data into the options', () => {
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
                                if (routerA.config.isDependentOnExternalData) {
                                    const showLink = routerA.link('show', {
                                        data: 'hellowworld' as any
                                    });
                                    expect(showLink).toContain('hellowworld');

                                    const showLinkPathData = routerA.link('show', {
                                        pathData: {[routerA.name]: 'hellowworld'}
                                    });
                                    expect(showLinkPathData).toContain('hellowworld');
                                }
                            });

                            it('can have the add cache option set', () => {
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

                                const showLink = routerA.link('show', {addCacheToLocation: true});
                                expect(showLink).toContain(routerA.manager.cacheKey);

                                const hideLink = routerA.link('hide', {addCacheToLocation: true});
                                expect(hideLink).toContain(routerA.manager.cacheKey);
                            });

                            it('by default doesnt have the add cache option set', () => {
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

                                const showLink = routerA.link('show');
                                expect(showLink).not.toContain(routerA.manager.cacheKey);

                                const hideLink = routerA.link('hide');
                                expect(hideLink).not.toContain(routerA.manager.cacheKey);
                            });
                        });
                    });
                });
        });
    });
});
