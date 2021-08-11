import {Component, Compiler, NgModule, Injectable, ComponentFactory} from "@angular/core";
import {Property} from "./editor-property.class";
import {ChangeDetector} from "./editor-change-detector";
import {DragSource} from "../ui/ui-dd.class";
import {EditorObjects} from "./editor-core-objects";
import {AppModule} from "../app.module";


export class UIComponent implements DragSource {
    // implement DragSource

    create() : any {
        return this.createDefault();

    }

    // instance data

    componentRegistry : ComponentRegistry;
    _decorator : (model : any, nativeElement : any) => void;
    abstract = false;
    _inherits : string[];
    ready = false;
    id : string;
    _group : string;
    label : string;
    icon : string;
    propertyList : Property[] = [];
    private properties : Map<string,Property> = new Map<string,Property>();
    private _validParents : string[] = [];
    private _orientation : string = undefined; // 'hor'/vert; // vert

    // constructor

    constructor(id : string) {
        this.id = id;
        this.label = id;
    }

    register(property : Property) : UIComponent {
        this.propertyList.push(property);
        this.properties.set(property.name, property);

        return this;
    }

    isValidParent(id : string) : boolean {
        return this._validParents.indexOf(id) >= 0;
    }

    // fluent

    public setLabel(label : string) : UIComponent {
        this.label = label;

        return this;
    }

    public setIcon(icon : string) : UIComponent {
        this.icon = icon;

        return this;
    }

    public orientation(name : string) : UIComponent {
        this._orientation = name;

        return this;
    }

    public group(name : string) : UIComponent {
        this._group = name;

        return this;
    }

    public validParents(...parents : string[]) : UIComponent {
        this._validParents = parents;

        return this;
    }

    public decorator(decorator : (model : any, native : any) => void) : UIComponent {
        this._decorator = decorator;

        return this;
    }

    public inherits(...id : string[]) : UIComponent {
        this._inherits = id;

        return this;
    }

    public isAbstract(value : boolean = true) : UIComponent {
        this.abstract = value;

        return this;
    }

    // public

    public deleteDefaults(model : any) {
        // delete empty children

        if (model.children && model.children.length == 0)
            delete model.children;

        for (let property of this.propertyList)
            if (property.name !== "id" && property.name !== "children" /*&& model[property.name]*/) {
                let def = property.createDefault();

                if (property.compare(model[property.name], def, property.name, []) == true) {
                    delete model[property.name];
                }
            } // if
    }

    public addDefaults(model : any) {
        for (let property of this.propertyList)
            if (property.name !== "id" && model[property.name] == undefined)
                model[property.name] = property.createDefault();
    }

    public createDefault() : any {
        // for now...

        let model = {
            id: this.id,
            children: []
        };

        this.addDefaults(model);

        return model;
    }

    // abstract

    public render(model : any, edit : boolean) : string {
        return ""
    }

    public setupChangeDetector(changeDetector : ChangeDetector, model : any) : ChangeDetector {
        for (let property of this.propertyList)
            if (property._composite)
                changeDetector.composite(property.name, property._composite);
            else
                changeDetector.property(property.name);

        // add children

        changeDetector.array("children");

        changeDetector.takeSnapshot(model);

        return changeDetector;
    }

    public getProperties() : Property[] {
        return this.propertyList;
    }

    // protected

    public findProperty(name) : Property {
        return this.properties.get(name);
    }

    protected getProperty(name) : Property {
        let property = this.findProperty(name);
        if (!property)
            throw 'unknown property ' + name;

        return property;
    }

    protected setValue(object, property, value) : void {
        if (typeof property === 'string')
            property = this.getProperty(property);

        object[property.name] = value;
    }

    protected getValue(object, property) : any {
        if (typeof property === 'string')
            property = this.getProperty(property);

        return object[property.name] || property.default;
    }

    public renderProperty(object : any, property : Property) : string {
        let value = object[property.name];
        if (!value)
            value = property.default;

        return property.renderFunction ? property.renderFunction(object, value) : value;
    }

    setup(componentRegistry : ComponentRegistry) : void {
        this.componentRegistry = componentRegistry;

        if (!this.ready) {
            // inherit

            if (this._inherits) {
                for (let from of this._inherits) {
                    for (let property of componentRegistry.find(from).getProperties())
                        this.register(property);
                }
            }
            // done

            this.ready = true;
        } // if
    }

    decorate(model : any, nativeElement : any) {
        if (this._decorator)
            this._decorator(model, nativeElement);
    }
}

@Injectable()
export class ComponentRegistry {
    // instance data

    public components : Map<string,UIComponent> = new Map<string,UIComponent>();

    // constructor

    constructor(private editorObjects : EditorObjects) {
        editorObjects.setup(this);

        this.setup();
    }

    // public

    public getComponents() : IterableIterator<UIComponent> {
        return this.components.values();
    }

    public register(component : UIComponent) : ComponentRegistry {
        this.components.set(component.id, component);

        return this;
    }

    public find(id : string) : UIComponent {
        return this.components.get(id);
    }

    // private

    private setup() : void {
        this.components.forEach((value, key) => {
            value.setup(this);
        });
    }
}

@Injectable()
export class ComponentFactoryBuilder {
    // instance data

    private factories : Map<string, ComponentFactory<any>> = new Map<string, ComponentFactory<any>>();

    // constructor

    constructor(private compiler : Compiler) {
        //Tracer.setTraceLevel('editor.render', TraceLevel.FULL);
    }

    // public

    public buildFactory(template : string, ...inputs : string[]) : ComponentFactory<any> {
        let factory = this.factories.get(template);
        if (!factory) {
            // TODO: 'inputs' mean nothing anymore in modern Angular
            const TemplateComponent = Component({template})(class {});

            const TemplateModule = NgModule({
              imports: [AppModule], // TODO
              declarations: [TemplateComponent]
            })(class {});

            let module = this.compiler.compileModuleAndAllComponentsSync(TemplateModule);

            factory = module.componentFactories.find((comp) =>
                comp.componentType === TemplateComponent
            );

            this.factories.set(template, factory);
        }

        return factory;
    }
}

// TODO

export class TemplateComponent extends UIComponent {
    // instance data

    private _editTemplate : string;
    private _renderTemplate : string;
    private editConstituents : any[];
    private renderConstituents : any[];

    // constructor

    constructor(id : string) {
        super(id);
    }

    // public

    public template(template : string) : TemplateComponent {
        this._editTemplate = template;
        this._renderTemplate = template;

        return this;
    }

    public renderTemplate(template : string) : TemplateComponent {
        this._renderTemplate = template;

        return this;
    }

    public editTemplate(template : string) : TemplateComponent {
        this._editTemplate = template;

        return this;
    }

    // override

    setup(componentRegistry : ComponentRegistry) : void {
        super.setup(componentRegistry);

        this.editConstituents = this.mergeConstituents(this.parse(this._editTemplate, true /* edit */));
        this.renderConstituents = this.mergeConstituents(this.parse(this._renderTemplate, false /* edit */));
    }

    // private

    private scan(template, callbacks) {
        let binding;
        // local functions

        function mode(ch) {
            if (ch === 'e' || ch === 'E')
                return 'edit';
            else if (ch === 'r' || ch === 'R')
                return 'runtime';
            else throw new Error('unsupported mode \'' + ch + '\'');
        }

        // go

        let start = 0;
        let i;

        while ((i = template.indexOf('$', start)) >= 0) {
            if (i > start)
                callbacks.string(template.substring(start, i));

            // search for closing $

            let end = template.indexOf('$', i + 1);

            // escape by $$

            if (end === i + 1) {
                callbacks.string('$');
                start = end + 1;
                continue;
            }

            let expression = template.substring(i + 1, end);

            // look for a =

            let eq = expression.indexOf('=');

            let optional = false;
            let restriction = undefined;

            if (eq > 0) {
                // $<attribute>=<property>$

                let attributeName = expression.substring(0, eq);
                if (attributeName[attributeName.length - 1] === '?') { // $<attribute>?=<property>$
                    optional = true;
                    attributeName = attributeName.substring(0, attributeName.length - 1);
                } // if

                if (attributeName[1] === ':') {
                    restriction = mode(attributeName[0]);
                    attributeName = attributeName.substring(2);
                } // if

                let property = expression.substring(eq + 1);

                binding = false;
                if (property[0] === '{' && property[property.length - 1] === '}') {
                    binding = true;

                    property = property.substring(1, property.length - 1);
                } // if

                callbacks.assignment(attributeName, property, optional, restriction, binding);
            } // if
            else {
                // $r:<property>?$

                if (expression[1] === ':') {
                    restriction = mode(expression[0]);
                    expression = expression.substring(2);
                } // if
                // " starts a literal

                let literal = false;
                if (expression[0] === '"') {
                    if (expression[expression.length - 1] !== '"')
                        throw new Error('expected closing "');

                    expression = expression.substring(1, expression.length - 1);

                    literal = true;
                } // if

                if (expression[expression.length - 1] === '?') { // $<attribute>?
                    optional = true;
                    expression = expression.substring(0, expression.length - 1);
                } // if

                binding = false;
                if (expression[0] === '{' && expression[expression.length - 1] === '}') {
                    binding = true;

                    expression = expression.substring(1, expression.length - 1);
                } // if

                callbacks.attribute(expression, optional, literal, restriction, binding);
            } // else

            // next

            start = end + 1;
        } // while

        // last element

        if (start < template.length)
            callbacks.string(template.substring(start));
    }

    private reservedWord(key : string) : boolean {
        return key == "#children"; // TODO more...
    }

    private replaceKey(key : string, editMode : boolean) : string {
        if (editMode) {
            if (key == "#children")
                return "<edit-component *ngFor='let child of children' [model]='child' [context]='self'></edit-component>";
        }
        else {
            return "<component *ngFor='let child of children' [model]='child' [context]='context'></component>"; // hmmm?
        }
    }

    private mergeConstituents(constituents) {
        let wasString = false;
        for (let i = 0; i < constituents.length; i++) {
            let constituent = constituents[i];

            if (typeof constituent === 'string') {
                if (wasString) {
                    constituents[i - 1] = constituents[i - 1] + constituent;

                    constituents.splice(i--, 1);
                } // if

                wasString = true;
            }
            else wasString = false;
        }

        return constituents;
    }

    private parse(template : string, editMode : boolean) : any[] {
        let result = [];

        this.scan(template, {
            string: (value) => {
                result.push(value);
            },

            attribute: (attribute, optional, literal, mode, binding) => {
                let ignore = mode && mode !== (editMode ? 'edit' : 'runtime');

                if (!ignore) {
                    if (literal)
                        result.push(attribute);

                    else if (this.reservedWord(attribute)) {
                        if (editMode === true)
                            result.push(this.replaceKey(attribute, editMode));
                        else { // #children...
                            result.push((element) => {
                                let result = '';
                                if (element.children)
                                    for (let child of element.children) {
                                        result += this.componentRegistry.find(child.id).render(child, false);
                                    }

                                return result;
                            });
                        }
                    }
                    else {
                        let property = this.getProperty(attribute);

                        if (property.allowBinding === true) {
                            result.push((element) => {
                                    let bindingOrValue = this.getValue(element, property);

                                    if (bindingOrValue.type == 'value') // renderProperty
                                        return property.renderFunction ? property.renderFunction(undefined, bindingOrValue.value) : bindingOrValue.value; // ugly
                                    else {
                                        if (editMode)
                                            return ''; // Do not render bindings in editMode
                                        else
                                            return (binding ? '{{' : '') + bindingOrValue.value + (binding ? '}}' : '');
                                    }
                                }
                            );
                        }
                        else {
                            result.push((element) => {
                                    let value = this.renderProperty(element, property);

                                    if (value !== undefined && value !== '' && value !== null)
                                        return value;

                                    else if (optional)
                                        return '';

                                    else
                                        return '';
                                }
                            );
                        }
                    }
                } // else
            },

            assignment: (attribute, value, optional, mode, binding) => {
                let ignore = mode && mode !== (editMode ? 'edit' : 'runtime');
                if (!ignore) {
                    let property = this.getProperty(value);

                    if (property.allowBinding === true) {
                        result.push((element) => {
                                let bindingOrValue = this.getValue(element, property);

                                if (bindingOrValue.type == 'value') // renderProperty
                                    return attribute + '="' + (property.renderFunction ? property.renderFunction(undefined, bindingOrValue.value) : bindingOrValue.value) + '"'; // ugly
                                else {
                                    // Do not render bindings in editMode

                                    if (editMode)
                                        return (!optional) ? attribute + '=""' : '';

                                    return attribute + '="' + (binding ? '{{' : '') + bindingOrValue.value + (binding ? '}}' : '') + '"';
                                }
                            }
                        );
                    }
                    else {
                        result.push((element) => {
                                let value = this.renderProperty(element, property); // will respect default values

                                if (value !== undefined && value !== '' && value !== null)
                                    return attribute + '="' + value + '"';

                                else {
                                    if (!optional)
                                        return attribute + '="' + value + '"';
                                    else
                                        return '';
                                }
                            }
                        );
                    }
                } // if
            }
        });

        return result;
    }

    // override

    public render(model : any, edit : boolean) : string {
        let constituents = edit ? this.editConstituents : this.renderConstituents;

        let result = '';

        for (let constituent of constituents) {
            if (typeof constituent === 'string')
                result += constituent;
            else
                result += constituent(model);
        } // for

        //if (Tracer.ENABLED)
        //    Tracer.trace('editor.render', TraceLevel.FULL, "render {0}", result);

        return result;
    }
}
