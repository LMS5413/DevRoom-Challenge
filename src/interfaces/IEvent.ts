export interface IEvent {
    name: string;
    run(...args: any[]): void;
}