export {};

declare global {
    function snowplow(...args: any[]): Void;
    var _env_: { [key: string]: string };
}

declare module '*.svg' {
    const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
    export default content;
}
