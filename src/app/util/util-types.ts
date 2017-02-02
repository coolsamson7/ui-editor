import {Injectable} from "@angular/core";

// the type system

export interface TypeDescriptor {
    baseType() : string;

    validate(o : any) : boolean;
}

export interface Constraint {
    eval(o : any) : boolean;
}

export class And implements Constraint {
    // instance data

    public constraints : Constraint[];

    // constructor

    constructor(...constraints : Constraint[]) {
        this.constraints = constraints;
    }

    // implement Constraint

    public eval(o : any) : boolean {
        for (let constraint of this.constraints)
            if (!constraint.eval(o))
                return false;

        return true;
    }
}

export class Or implements Constraint {
    // instance data

    public constraints : Constraint[];

    // constructor

    constructor(constraints : Constraint[]) {
        this.constraints = constraints;
    }

    //constructor(...constraints : Constraint[]) {
    //    this.constraints = constraints;
    //}

    // implement Constraint

    public eval(o : any) : boolean {
        for (let constraint of this.constraints)
            if (constraint.eval(o))
                return true;

        return false;
    }
}

export abstract class AbstractConstraint implements Constraint {
    // methods

    public and(...constraints : Constraint[]) {
        constraints.unshift(this);

        return new And(...constraints);
    }

    public or(...constraints : Constraint[]) {
        constraints.unshift(this);

        return new Or(constraints);
    }

    public eval(o : any) : boolean {
        return false;
    }
}

// TODO: more...

export class AbstractTypeDescriptor implements TypeDescriptor {
    // instance data

    private type : string;
    private constraint : Constraint;

    // constructor

    constructor(type : string, constraint : Constraint) {
        this.type = type;
        this.constraint = constraint;
    }

    // methods

    public validate(o : any) : boolean {
        return typeof o === this.type && (!this.constraint || this.constraint.eval(o));
    }

    public baseType() : string {
        return this.type;
    }
}

export class AbstractEnumTypeDescriptor extends AbstractTypeDescriptor {
    // instance data

    private values : any[];

    // constructor

    constructor(...values : any[]) {
        super(typeof values[0], new Or(values.map((value)=>new Equals(value))));

        this.values = values;
    }

    // public

    public getValues() : any[] {
        return this.values;
    }
}

export class RGB extends AbstractEnumTypeDescriptor {
    constructor() {
        super("red", "green", "blue");
    }
}

// constraints

export class LengthConstraint extends AbstractConstraint {
    // instance data

    private len : number;

    // constructor

    constructor(len : number) {
        super();

        this.len = len;
    }

    // override

    public eval(o : any) : boolean {
        return o.length <= this.len;
    }
}

export class Less extends AbstractConstraint {
    // instance data

    private value : number;

    // constructor

    constructor(value : number) {
        super();

        this.value = value;
    }

    // override

    public eval(o : any) : boolean {
        return o < this.value;
    }
}

export class Greater extends AbstractConstraint {
    // instance data

    private value : number;

    // constructor

    constructor(value : number) {
        super();

        this.value = value;
    }

    // override

    public eval(o : any) : boolean {
        return o > this.value;
    }
}

export class Equals extends AbstractConstraint {
    // instance data

    private value : any;

    // constructor

    constructor(value : any) {
        super();

        this.value = value;
    }

    // override

    public eval(o : any) : boolean {
        return o == this.value;
    }
}

// TODO functions

export function length(len : number) : LengthConstraint {
    return new LengthConstraint(len);
}

export function lt(value : number) : Less {
    return new Less(value);
}

export function gt(value : number) : Greater {
    return new Greater(value);
}

// constraints

export class StringTypeDesriptor extends AbstractTypeDescriptor {
    // static methods

    // constructor

    constructor(constraint : Constraint) {
        super('string', constraint);
    }
}

export class NumberTypeDesriptor extends AbstractTypeDescriptor {
    // constructor

    constructor(constraint : Constraint) {
        super('number', constraint);
    }
}

// test

@Injectable()
export class ConstraintService {
    // instance data

    private registry: any;

    // constructor

    constructor() {
        this.registry = {};

        // global operators

        this.registerConstraint('<', function () {
            return new Less(arguments[0]);
        });

        //this.registerConstraint('<=', function () {
        //    return new foundation.validation.LessEquals({value: arguments[0]});
        //});
        this.registerConstraint('>', function () {
            return new Greater(arguments[0]);
        });
        //this.registerConstraint('>=', function () {
        //      return new foundation.validation.GreaterEquals({value: arguments[0]});
        //});

        // string stuff

        this.registerConstraint('length', function () {
            return new LengthConstraint(arguments[0]);
        });
        /*
         this.registerConstraint('min-length', function () {
         return new foundation.validation.MinLength({value: arguments[0]});
         });

         this.registerConstraint('max-length', function () {
         return new foundation.validation.Length({value: arguments[0]});
         });

         this.registerConstraint('fix-length', function () {
         return new foundation.validation.FixLength({value: arguments[0]});
         });

         this.registerConstraint('regexp', function () {
         return new foundation.validation.Regexp({value: arguments[0]});
         });

         // numbers

         this.registerConstraint('precision', function () {
         return new foundation.validation.Precision({value: arguments[0]});
         });
         this.registerConstraint('scale', function () {
         return new foundation.validation.Scale({value: arguments[0]});
         });*/
    }

    // methods

    private registerConstraint(operator : string, factory) : void {
        this.registry[operator] = factory;
    }

    private createConstraint (operator, value) : Constraint {
        return this.registry[operator].apply(null, [value]);
    }

    private parseConstraint(input : string) : any[] {
        // local functions

        function tokenize(input) {
            function isWS(c) {
                return (c <= 32 && c >= 0) || c == 127;
            }

            var result = [];

            var wasWS = true;
            var start = 0;
            var i;
            var inString = false;

            for (i = 0; i < input.length; i++) {
                var c = input[i];

                if (c === '"') {
                    if (inString) {
                        if (i - start > 0)
                            result.push(input.substring(start + 1, i));
                    }
                    else {
                        inString = true;
                        start = i;
                    }
                }
                else if (!inString) {
                    var ws = isWS(input.charCodeAt(i));

                    if (ws != wasWS) {
                        if (ws) {
                            if (i - start > 0)
                                result.push(input.substring(start, i));
                        }
                        else
                            start = i;

                        // next

                        wasWS = ws;
                    } // if
                }
            } // for

            if (!wasWS && i - start > 0)
                result.push(input.substring(start, i));

            return result;
        }

        var constraint : Constraint = undefined;

        var type = undefined;

        // parse

        var matches = tokenize(input);//.match(/\S+/g); // check for % 2 === 0

        if (matches.length % 2 !== 0)
            throw new Error('expected even number of arguments');

        if (matches[0] == 'type')
            type = matches[1];
        else
            throw new Error('expected type argument');

        for (var i = 2; i < matches.length; i++) {
            var key = matches[i++];
            var value = matches[i];

            // convert value

            switch (type) {
                case 'number':
                    value = parseInt(value);
                    break;

                case 'float': // not a low level type...
                    value = parseFloat(value);
                    break;

                case 'string':
                    break;

                case 'boolean':
                    value = value.toLocaleLowerCase() === 'true';
                    break;

                default:
                    throw new Error('unknown type ' + type);
            }

            var newConstraint : Constraint = this.createConstraint(key, value);

            if (!constraint)
                constraint = newConstraint;

            else {
                if (constraint instanceof And)
                    (constraint as And).constraints.push(newConstraint);
                else
                    constraint = new And(constraint, newConstraint);
            }
        } // for

        return [type, constraint];
    }

    // public

    public make(constraint : string) : TypeDescriptor {
        let typeAndConstraint = this.parseConstraint(constraint);

        let type : string = typeAndConstraint[0];
        let cons : Constraint = typeAndConstraint[1];

        if (type == 'string')
            return new StringTypeDesriptor(cons);
        else if (type == 'number')
            return new NumberTypeDesriptor(cons);
        else
            return undefined;
    }
}