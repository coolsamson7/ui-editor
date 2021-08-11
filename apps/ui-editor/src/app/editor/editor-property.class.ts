import {TypeDescriptor, AbstractEnumTypeDescriptor, AbstractTypeDescriptor} from "../util/util-types";

export class Property {
    // instance data

    name : string;
    group : string = 'main';
    type : string | TypeDescriptor = "string";
    allowBinding : boolean = false;
    isArtificial = false;
    _composite : string[];
    default : any | Function;
    renderFunction : (model : any, value : any) => string;
    _tooltip : string;
    _editor : any;

    // constructor

    constructor(name : string) {
        this.name = name;
    }

    // TODO: new

    clone(obj : any) : any {
        let copy;

        // 3 simple types, and null or undefined

        if (null == obj || "object" != typeof obj)
            return obj;

        //  Date

        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());

            return copy;
        }

        // Array

        if (obj instanceof Array) {
            copy = [];
            for (let i = 0, len = obj.length; i < len; i++)
                copy[i] = this.clone(obj[i]);

            return copy;
        }

        // Object

        if (obj instanceof Object) {
            copy = {};
            for (let attr in obj)
                if (obj.hasOwnProperty(attr))
                    copy[attr] = this.clone(obj[attr]);

            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }


    public copyValue(value : any) {
        let copy = value;

        if (this.allowBinding) {
            copy = {
                type: value.type,
                value: this.clone(value.value)
            };
        }
        else copy = this.clone(copy);

        // done

        return copy;
    }

    deepCompare(v1 : any, v2 : any, path : string, diffs : any[]) : boolean {
        let leftChain = [];
        let rightChain = [];

        // local function

        function check(v1 : any, v2 : any, expression : boolean, path : string) : boolean {
            if (!expression)
                diffs.push({
                    path: path,
                    v1: v1,
                    v2: v2
                });

            return expression;
        }

        function properties(o1 : any, o2 : any) : string[][] {
            let left : string[] = [];
            let comm : string[] = [];
            let right : string[] = [];

            for (let key of Object.keys(o1))
                if (o2.hasOwnProperty(key))
                    comm.push(key);
                else
                    left.push(key);

            for (let key of Object.keys(o2))
                if (!o1.hasOwnProperty(key))
                    right.push(key);

            return [left, comm, right];
        }

        function compare2Objects(x, y, path : string) {
            // remember that NaN === NaN returns false
            // and isNaN(undefined) returns true

            if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number')
                return true;

            // Compare primitives and functions.
            // Check if both arguments link to the same object.
            // Especially useful on the step where we compare prototypes

            if (x === y)
                return true;

            // Works in case when functions are created in constructor.
            // Comparing dates is a common scenario. Another built-ins?
            // We can even handle functions passed across iframes
            if ((typeof x === 'function' && typeof y === 'function') ||
                (x instanceof Date && y instanceof Date) ||
                (x instanceof RegExp && y instanceof RegExp) ||
                (x instanceof String && y instanceof String) ||
                (x instanceof Number && y instanceof Number)) {
                return check(x, y, x.toString() === y.toString(), path);
            }

            // At last checking prototypes as good as we can
            if (!(x instanceof Object && y instanceof Object))
                return check(x, y, false, path);

            if (x.isPrototypeOf(y) || y.isPrototypeOf(x))
                return check(x, y, false, path);

            if (x.constructor !== y.constructor)
                return check(x, y, false, path);

            if (x.prototype !== y.prototype)
                return check(x, y, false, path);

            // Check for infinitive linking loops

            if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1)
                return check(x, y, false, path); // TODO better message

            // compare composite objects

            let keys : string[][] = properties(x, y);

            // recursion

            let all_keys = [].concat.apply([], keys as any);

            for (let key of all_keys) {
                leftChain.push(x);
                rightChain.push(y);

                compare2Objects(x[key], y[key], path + "." + key);

                leftChain.pop();
                rightChain.pop();
            } // for

            return true;
        }

        // get goin'

        return compare2Objects(v1, v2, path);
    }

    // return true if the values are equal!

    public compare(v1 : any, v2 : any, path : string, diffs : any[]) : boolean {
        let defaultValue = this.createDefault();

        if (this.allowBinding) {
            if (v1.value == undefined)
                v1.value = defaultValue;

            if (v2.value == undefined)
                v2.value = defaultValue;
        }
        else {
            if (v1 == undefined)
                v1 = defaultValue;

            if (v2 == undefined)
                v2 = defaultValue;
        }

        // compare values

        this.deepCompare(v1, v2, path, diffs);

        return diffs.length == 0;
    }

    // TEST TODO

    public valueOf(object : any) {
        return object[this.name]; // default?
    }

    /*public renderObject() {
     var value = object[property.name];
     if (!value)
     value = property.default;

     return property.renderFunction ? property.renderFunction(object, value) : value;
     }*/

    // fluent

    tooltip(tooltip : string) : Property {
        this._tooltip = tooltip;

        return this;
    }

    editor(editor : string) : Property {
        this._editor = editor;

        return this;
    }

    render(func : (model : any, value : any) => string) : Property {
        this.renderFunction = func;

        return this;
    }

    artificial(value : boolean = true) : Property {
        this.isArtificial = value;

        return this;
    }

    inGroup(name : string) : Property {
        this.group = name;

        return this;
    }

    public setDefault(value : any | Function) : Property {
        this.default = value;

        return this;
    }

    public setType(type : string | TypeDescriptor) : Property {
        this.type = type;

        return this;
    }

    public composite(...args : string[]) : Property {
        this._composite = args;

        return this;
    }

    public binding(allow : boolean = true) : Property {
        this.allowBinding = allow;

        return this;
    }

    createDefault() {
        let value;

        if (this.default !== undefined) {
            if (typeof this.default == "function")
                value = this.default();
            else
                value = this.default;
        }
        else {
            let type = this.type;
            if (type instanceof AbstractEnumTypeDescriptor)
                value = (<AbstractEnumTypeDescriptor>(type)).getValues();

            else if (type instanceof AbstractTypeDescriptor)
                type = (<AbstractTypeDescriptor>type).baseType();

            if (type == "string")
                value = "";
            else if (type == "number")
                value = 0;
        }

        return this.allowBinding ? {type: "value", value: value} : value;
    }
}
