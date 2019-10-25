declare type EventCliSessionStarted = {
    nextVersion: string;
    nodeVersion: string;
    cliCommand: string;
    isSrcDir: boolean | null;
};
export declare function eventVersion(event: Omit<EventCliSessionStarted, 'nextVersion' | 'nodeVersion'>): {
    eventName: string;
    payload: EventCliSessionStarted;
}[];
export {};
