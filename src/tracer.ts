/**
 * Tracking one or more TracerSessions. 
 */
export class TracerManager {
    public pastSessions: TracerSession[];
    public currentSessions: { [sessionName: string]: TracerSession };

    constructor() {
        this.pastSessions = [];
        this.currentSessions = {};
    }
    public get lastSession() { return this.pastSessions.sort((a: TracerSession, b: TracerSession) => a.startTime > b.startTime ? 1 : -1) }

    public newSession(name: ITracerSession['name']): TracerSession {
        if (this.currentSessions[name]) {
            return this.currentSessions[name]
        }
        const session = new TracerSession(name);
        session.manager = this;
        this.currentSessions[name] = session;
        return session;
    }

    public _moveSessionToFinishedStorage(session: TracerSession) {
        delete this.currentSessions[session.name];
        this.pastSessions.push(session)
    }

}

export interface ITracerSession {
    manager: TracerManager;
    isActive: boolean;
    name: string;
    startTime: Date;
    endMessage: string;
    endTime: Date
    tracerThings: { [tracerThingName: string]: TracerThing }
}

/**
 * Tracking one or more TracerThings. Can be started and stopped.
 */
export class TracerSession implements ITracerSession {
    public manager: TracerManager;
    public isActive: boolean;
    public name: string;
    public startTime: Date;
    public endMessage: string;
    public endTime: Date;
    public tracerThings: { [tracerThingName: string]: TracerThing }

    constructor(name: ITracerSession['name']) {
        this.name = name;
        this.startTime = new Date();
        this.tracerThings = {};
    }

    public tracerThing(thingName: string): TracerThing {
        if (this.tracerThings[thingName]) {
            return this.tracerThings[thingName]
        }
        const tracer = new TracerThing(thingName);
        this.tracerThings[thingName] = tracer;
        return tracer;
    }

    public endWithMessage(message: ITracerSession['endMessage']) {

        if (this.isActive) {
            this.endMessage = message;
            this.end();
        }
    }

    public end() {
        console.log(this.tracerThings) // tslint:disable-line

        this.manager._moveSessionToFinishedStorage(this);
        if (this.isActive) {
            this.endTime = new Date();
            Object.keys(this.tracerThings).forEach(thingName => {
                this.tracerThings[thingName].end();
            })
            this.isActive = false;
            console.log(this.tracerThings) // tslint:disable-line
        }
    }


}

export interface IStep {
    time: Date;
    name: string;
    info: object;
}

export interface ITracerThing {
    isActive: boolean;
    name: string;
    startTime: Date;
    steps: IStep[];
    postEndSteps: IStep[];
    endMessage: string;
    endTime: Date
}

class TracerThing implements ITracerThing {
    public isActive: boolean;
    public name: string;
    public startTime: Date;
    public steps: IStep[];
    public postEndSteps: IStep[];
    public endMessage: string;
    public endTime: Date

    constructor(thingName: ITracerThing['name']) {
        this.isActive = true;
        this.name = thingName;
        this.startTime = new Date()
        this.steps = [];
        this.postEndSteps = [];
        this.endMessage = undefined;
        this.endTime = undefined;

    }

    public logStep(name: IStep['name'], info?: IStep['info']) {
        const step: IStep = {
            time: new Date(),
            name,
            info
        }
        if (this.isActive) {
            this.steps.push(step);
        } else {
            this.postEndSteps.push(step);
        }
    }

    public endWithMessage(reason: ITracerThing['endMessage']) {
        if (this.isActive) {
            this.endMessage = reason;
            this.end();
        }
    }

    public end() {
        if (this.isActive) {
            this.endTime = new Date();
            this.isActive = false;
        }
    }
}

export const tracerManager = new TracerManager();
