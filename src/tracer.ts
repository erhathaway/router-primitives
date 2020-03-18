/**
 * Tracking one or more TracerSessions.
 *
 * Has the concept of 'tracer sessions'.
 * There exists the ability to:
 * - start a new session
 * - view the last session
 * - view all previous sessions
 *
 */

export interface IStep {
    time: number;
    name: string;
    info: object;
}

export interface ITracerThing {
    isActive: boolean;
    name: string;
    startTime: number;
    steps: IStep[];
    postEndSteps: IStep[];
    endMessage: string;
    endTime: number;
    session: ITracerSession;

    start: () => void;

    logStep: (name: IStep['name'], info?: IStep['info']) => void;

    endWithMessage: (reason: ITracerThing['endMessage']) => void;
    end: () => void;
}

// eslint-disable-next-line
export type ThingSubscription = (tracerThingInfo: ITracerThing) => any;

export interface ITracerManager {
    pastSessions: ITracerSession[];
    currentSessions: {[sessionName: string]: ITracerSession};

    lastSession: ITracerSession;

    newSession: (name: ITracerSession['name']) => ITracerSession;

    _moveSessionToFinishedStorage: (session: ITracerSession) => void;
}

export interface ITracerSession {
    manager: ITracerManager;
    isActive: boolean;
    name: string;
    startTime: number;
    endMessage: string;
    endTime: number;
    tracerThings: {[tracerThingName: string]: ITracerThing};
    thingSubscriptions: {[thingName: string]: ThingSubscription[]};

    subscribeToThing: (thingName: string, callbackFn: ThingSubscription) => void;

    removeAllSubscriptions: () => void;

    notifySubscribersOfThingUpdate: (nameOfUpdatedThing: string) => void;

    tracerThing: (thingName: string) => ITracerThing;

    endWithMessage: (message: ITracerSession['endMessage']) => void;

    end: () => void;
}

class TracerThing implements ITracerThing {
    public isActive: boolean;
    public name: string;
    public startTime: number;
    public steps: IStep[];
    public postEndSteps: IStep[];
    public endMessage: string;
    public endTime: number;
    public session: ITracerSession;

    constructor(thingName: ITracerThing['name']) {
        this.name = thingName;
        this.steps = [];
        this.postEndSteps = [];
        this.startTime = undefined;
        this.isActive = undefined;
        this.endMessage = undefined;
        this.endTime = undefined;
    }

    public start(): void {
        this.startTime = performance.now();
        this.isActive = true;
        this.session.notifySubscribersOfThingUpdate(this.name);
    }

    public logStep(name: IStep['name'], info?: IStep['info']): void {
        const step: IStep = {
            time: performance.now(),
            name,
            info
        };
        if (this.isActive) {
            this.steps.push(step);
        } else {
            this.postEndSteps.push(step);
        }
        this.session.notifySubscribersOfThingUpdate(this.name);
    }

    public endWithMessage(reason: ITracerThing['endMessage']): void {
        if (this.isActive) {
            this.endMessage = reason;
            this.end();
        }
    }

    public end(): void {
        if (this.isActive) {
            // console.log('ENDING THING TRACER:', this.name);
            this.endTime = performance.now();
            this.isActive = false;
            this.session.notifySubscribersOfThingUpdate(this.name);
        }
    }
}

/**
 * Tracking one or more TracerThings. Can be started and stopped.
 */
export class TracerSession implements ITracerSession {
    public manager: ITracerManager;
    public isActive: boolean;
    public name: string;
    public startTime: number;
    public endMessage: string;
    public endTime: number;
    public tracerThings: {[tracerThingName: string]: ITracerThing};
    public thingSubscriptions: {[thingName: string]: ThingSubscription[]};

    constructor(name: ITracerSession['name']) {
        this.isActive = true;
        this.name = name;
        this.startTime = performance.now();
        this.tracerThings = {};
        this.thingSubscriptions = {};
    }

    public subscribeToThing(thingName: string, callbackFn: ThingSubscription): void {
        const subscriptions = this.thingSubscriptions[thingName] || [];
        subscriptions.push(callbackFn);
        this.thingSubscriptions[thingName] = subscriptions;

        const thing = this.tracerThings[thingName];
        if (thing) {
            callbackFn(thing);
        }
    }

    public removeAllSubscriptions(): void {
        this.thingSubscriptions = {};
    }

    public notifySubscribersOfThingUpdate(nameOfUpdatedThing: string): void {
        const subscriptions = this.thingSubscriptions[nameOfUpdatedThing] || [];
        const thing = this.tracerThings[nameOfUpdatedThing];
        subscriptions.forEach(notifySubscriber => {
            if (thing) {
                notifySubscriber(thing);
            }
        });
    }

    public tracerThing(thingName: string): ITracerThing {
        if (this.tracerThings[thingName]) {
            return this.tracerThings[thingName];
        }
        const tracer = new TracerThing(thingName);
        tracer.session = this;
        this.tracerThings[thingName] = tracer;
        tracer.start();
        return tracer;
    }

    public endWithMessage(message: ITracerSession['endMessage']): void {
        if (this.isActive) {
            this.endMessage = message;
            this.end();
        }
    }

    public end(): void {
        // console.log('ENDING TRACER SESSION'); // tslint:disable-line
        // console.log('hi')
        if (this.isActive) {
            // console.log('ENDING AGAIN');
            Object.keys(this.tracerThings).forEach(thingName => {
                this.tracerThings[thingName].end();
            });
            this.endTime = performance.now();
            this.isActive = false;
            this.manager._moveSessionToFinishedStorage(this);
            // console.log(this); // tslint:disable-line
        }
    }
}

export class TracerManager implements ITracerManager {
    public pastSessions: ITracerSession[];
    public currentSessions: {[sessionName: string]: ITracerSession};

    constructor() {
        this.pastSessions = [];
        this.currentSessions = {};
    }
    public get lastSession(): ITracerSession {
        return this.pastSessions.sort((a: ITracerSession, b: ITracerSession) =>
            a.startTime > b.startTime ? 1 : -1
        )[0];
    }

    public newSession(name: ITracerSession['name']): ITracerSession {
        if (this.currentSessions[name]) {
            return this.currentSessions[name];
        }
        const session = new TracerSession(name);
        session.manager = this;
        this.currentSessions[name] = session;
        return session;
    }

    public _moveSessionToFinishedStorage(session: ITracerSession): void {
        delete this.currentSessions[session.name];
        this.pastSessions.push(session);
    }
}

export const tracerManager = new TracerManager();
