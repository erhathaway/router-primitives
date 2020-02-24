// import defaultTemplates from '../router/template';
import { IRouterTemplate } from '../types';
// export type DefaultTemplates = typeof defaultTemplates;

export interface DefaultTemplates {
    scene: IRouterTemplate<
        {
            blueWorld: boolean;
        },
        'testAction'
    >;
    stack: IRouterTemplate<{}, 'forward' | 'backward' | 'toFront' | 'toBack'>;
    data: IRouterTemplate<
        {
            data?: string;
        },
        'setData'
    >;
    feature: IRouterTemplate<{}, null>;
    root: IRouterTemplate<{}, 'rootAction'>;
}
