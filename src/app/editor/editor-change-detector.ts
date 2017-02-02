
class Check {
    // instance data

    property: string;
    protected snapshot : any;

    // constructor

    constructor(property: string) {
        this.property  = property;
    }

    // protected

    protected compare(oldValue: any, newValue: any) : boolean {
        // remember new value

        this.snapshot = newValue;

        let changed = oldValue !== newValue;

        // TODO
        //if (changed)
        //   console.log(this.property + ": '" + JSON.stringify(oldValue) + "' -> '" + JSON.stringify(newValue) + "'");

        return changed
    }

    // public

    public takeSnapshot(object : any) {
        this.snapshot = object;
    }


    public diff(object : any) : boolean {
        return this.compare(this.snapshot, object[this.property]);
    }
}

class CompositeCheck extends Check {
    // instance data

    private properties : string[];

    // constructor

    constructor(prop: string, properties : string[]) {
        super(prop);

        this.properties = properties;
    }

    // private

    public takeSnapshot(object : any) {
        if (this.snapshot)
            this.snapshot.length = 0; // reuse...
        else
            this.snapshot = [];

        for (let property of this.properties)
            this.snapshot.push(object ? object[property] : undefined);
    }

    // override

    public compare(snapshot: any, newValue: any) : boolean {
        let diff = false;

        if (newValue) {
            if (snapshot === undefined) {
                diff = true;

                this.takeSnapshot(newValue);
            } // if
            else {
                // compare properties

                for (let i in this.properties) {
                    if (newValue[this.properties[i]] !== snapshot[i])
                        diff = true;

                    this.snapshot[i] = newValue[this.properties[i]];
                } // for
            } // else
        } // if
        else {
            this.snapshot = undefined;
            diff = snapshot !== undefined;
        }

        // done

        return diff;
    }
}

class ArrayCheck extends Check {
    // constructor

    constructor(property: string) {
        super(property);
    }

    // private

    public takeSnapshot(newValue) {
        if (this.snapshot)
            this.snapshot.length = 0; // reuse...
        else
            this.snapshot = [];

        for (let i in newValue)
            this.snapshot.push(newValue[i]);
    }

    // override

    public compare(oldValue: any, newValue: any) : boolean {
        let diff = false;

        if (newValue) {
            if (oldValue === undefined) {
                diff = true;

                this.takeSnapshot(newValue);
            } // if
            else {
                // compare two array...

                if (oldValue.length != newValue.length) {
                    diff = true;

                    this.takeSnapshot(newValue);
                }
                else {
                    // compare elements

                    for (let i in newValue) {
                        if (newValue[i] !== oldValue[i])
                            diff = true;

                        this.snapshot[i] = newValue[i];
                    } // for
                }
            } // else
        } // if
        else {
            this.snapshot = undefined;
            diff = oldValue !== undefined;
        }

        // done

        return diff;
    }
}

export class ChangeDetector {
    // instance data

    private checks : Check[] = []; // includes snapshot

    // public

    public takeSnapshot(object : any) : void {
        for (let check of this.checks)
            check.takeSnapshot(object[check.property]);
    }

    public check(object : any) : boolean {
        let diff = false;

        for (let check of this.checks) {
            if (check.diff(object))
                diff = true; // don't break since we need the old values
        } // for

        return diff;
    }

    // public

    public composite(prop : string, args : string[]) : ChangeDetector {
        this.checks.push(new CompositeCheck(prop, args));

        return this;
    }

    public property(prop : string) : ChangeDetector {
        this.checks.push(new Check(prop));

        return this;
    }

    public array(prop : string) : ChangeDetector {
        this.checks.push(new ArrayCheck(prop));

        return this;
    }
}