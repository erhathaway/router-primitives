/**
 * Tracking one or more TracerSessions. 
 */
class TracerManager {

    public pastSessions: TracerSession[];
    public currentSessions: { [sessionName: string]: TracerSession };

    public get lastSession() { return this.pastSessions.sort((a: TracerSession, b: TracerSession) => a.startTime > b.startTime ? 1 : -1) }

    public newSession(name: ITracerSession['name']) {
        if (this.currentSessions[name]) {
            throw new Error(`Could not create a session. The name ${name} is already taken. Try 'newSession' with a different name`)
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

interface ITracerSession {
    manager: TracerManager;
    isActive: boolean;
    name: string;
    startTime: Date;
    endMessage: string;
    endTime: Date
    tracerThings: { [tracerThingName: string]: ITracerThing }
}
/**
 * Tracking one or more TracerThings. Can be started and stopped.
 */
class TracerSession implements ITracerSession {
    public manager: TracerManager;
    public isActive: boolean;
    public name: string;
    public startTime: Date;
    public endMessage: string;
    public endTime: Date;
    public tracerThings: { [tracerThingName: string]: ITracerThing }

    constructor(name: ITracerSession['name']) {
        this.name = name;
        this.startTime = new Date();
    }

    public traceAThing = (thingName: string) => {
        if (this.tracerThings[thingName]) {
            throw new Error(`Could not create a tracer. The name ${thingName} is already taken. Try 'traceAThing' with a different name`)
        }
        const tracer = new TracerThing(thingName);
        this.tracerThings[thingName] = tracer;
        return tracer;
    }

    public endWithMessage(message: ITracerSession['endMessage']) {
        this.endMessage = message;
        this.endTime = new Date();
        this.isActive = false;
    }

    public end() {
        this.manager._moveSessionToFinishedStorage(this);
        this.isActive = false;
    }

}

interface IStep {
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

    public logStep(name: IStep['name'], info: IStep['info']) {
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
        this.endMessage = reason;
        this.endTime = new Date();
        this.isActive = false;
    }

    public end() {
        this.isActive = false;
    }
}

export { TracerManager, TracerThing }