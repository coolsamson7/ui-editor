export enum TraceLevel {
    OFF = 0,
    LOW,
    MEDIUM,
    HIGH,
    FULL
}

export class Tracer {
    // static

    private static instance : Tracer = new Tracer();

    // instance data

    private traceLevels = {}; // path -> trace-level
    private cachedTraceLevels = {};
    private modifications = 0;
    private messageFormat = '';

    // public variables

    public static ENABLED = true;

    // local functions

    private format(format) : string {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    }

    private getTraceLevel(path) : TraceLevel {
        // check dirty state

        if (this.modifications > 0) {
            this.cachedTraceLevels = {}; // restart from scratch
            this.modifications = 0;
        } // if

        var level = this.cachedTraceLevels[path];
        if (!level) {
            level = this.traceLevels[path];
            if (!level) {
                var index = path.lastIndexOf('.');
                level = index != -1 ? this.getTraceLevel(path.substring(0, index)) : TraceLevel.OFF;
            } // if

            // cache

            this.cachedTraceLevels[path] = level;
        } // if

        return level;
    };

    // provider api

    public static enable() : void {
        this.ENABLED = true;
    };

    public static setMessageFormat(format) {
        Tracer.instance.messageFormat = format;
    };

    public static setTraceLevel(path : string, level : TraceLevel) : void {
        Tracer.instance.traceLevels[path] = level;
        Tracer.instance.modifications++;
    }

    public static trace (path : string, level: TraceLevel, message : string) {
        if (Tracer.instance.getTraceLevel(path) >= level) {
            // format

            var args = Array.prototype.slice.call(arguments, 3);
            var formattedMessage = message.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });

            // and write

            console.log(Tracer.instance.messageFormat + '[' + path + ']: ' + formattedMessage); // for now...
        }
    }
}