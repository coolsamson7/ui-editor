import {
    OnInit,
    Input,
    OnChanges,
    SimpleChanges,
    ComponentRef,
    ComponentFactory,
    Injectable,
    OnDestroy,
    Component,
    ViewContainerRef,
    ViewChild,
    NgModule,
    Compiler,
    EventEmitter,
    Output
} from "@angular/core";
import {TypeDescriptor, AbstractTypeDescriptor, AbstractEnumTypeDescriptor} from "../util/util-types";
import {HashMap} from "../util/util-map";

import {Property} from "./editor-property.class";
import {UIComponent, ComponentRegistry} from "./editor-component.class";
import {AppModule} from "../app.module";


class EditorKey {
    // instance data

    private type : string;
    private descriptor : TypeDescriptor;

    // constructor

    constructor(type : string, descriptor : TypeDescriptor) {
        this.type = type;// ? type : descriptor.baseType();
        this.descriptor = descriptor;
    }

    // public

    public equals(key : EditorKey) : boolean {
        return this.type == key.type && this.descriptor == key.descriptor; // TODO equals?
    }

    public hashCode() : number {
        return this.type ? HashMap.stringHash(this.type) : 1; // TODO
    }
}

@Injectable()
export class PropertyEditorBuilder {
    // instance data

    private registry : HashMap<EditorKey,string>;
    private factories : Map<string,ComponentFactory<any>> = new Map<string,ComponentFactory<any>>();

    // constructor

    constructor(private compiler: Compiler) {
        this.registry = new HashMap<EditorKey,string>(
            key => key.hashCode(), // for now...
            (v1, v2) => v1.equals(v2) // equals
        );

        this.setup();
    }

    private buildFactory(template : string) : ComponentFactory<any> {
        @Component({
            inputs: ['model'], // ??
            template: template
        })
        class PropertyEditorComponent {
        }

        // the module

        @NgModule({
            imports: [AppModule], // TODO
            declarations: [PropertyEditorComponent]
        })
        class PropertyEditorModule {
        }

        // compile and create

        let module = this.compiler.compileModuleAndAllComponentsSync(PropertyEditorModule);

        return module.componentFactories.find((comp) =>
            comp.componentType === PropertyEditorComponent
        );
    }

    // public

    public getFactory(type : string | TypeDescriptor, property : string, editor : string) : ComponentFactory<any> {
        let args = [property];
        let template = editor ? editor : this.getTemplate4(type);
        // set property name
        template = template.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });


        let factory = this.factories.get(template);
        if (!factory)
            this.factories.set(template, factory = this.buildFactory(template));

        return factory;
    }

    // public

    public register(type : string, template : string) : PropertyEditorBuilder {
        this.registry.put(new EditorKey(type, undefined), template);

        return this;
    }

    // private

    private getTemplate4(type : string | TypeDescriptor) : string {
        let key : EditorKey = type instanceof AbstractTypeDescriptor ?
            new EditorKey(undefined, <AbstractTypeDescriptor>type) :
            new EditorKey(<string>type, undefined);

        let template =  this.registry.get(key);

        if (!template && type instanceof AbstractEnumTypeDescriptor) {
            this.registry.put(key, template = '<enum-property [type]="type" [model]="model" [property]="\'{0}\'">'); // cache
        }

        return template;
    }

    // private

    private setup() : void {
        this
            .register('number', '<input class="form-control" type="number" (ngModelChange)="onChange($event)" [(ngModel)]="model.{0}">')
            .register('string', '<input class="form-control" type="text" (ngModelChange)="onChange($event)" [(ngModel)]="model.{0}">')
            .register('boolean', '<boolean-property [model]="model" (onChange)="onChange($event)" [property]="\'{0}\'">')
    }
}


@Component({
    selector: 'boolean-property',
    template: `
<select class="form-control boolean-property" [(ngModel)]="value" (ngModelChange)="onModelChange($event)">
    <option *ngFor="let value of values" [ngValue]="value">{{value}}</option>
 </select>
`
})
export class BooleanPropertyComponent {
    // instance data

    @Input()
    private model: any;
    @Input()
    private property : string;
    private values = [true, false];
    private value : any;
    @Output() onChange = new EventEmitter();

    // callbacks

    onModelChange(value) {
        this.onChange.emit({
            model: this.model,
            attribue: this.property,
            newValue: value
        });

        this.model[this.property] = value;
    }

    // OnChanges

    ngOnChanges(changes: SimpleChanges): void {
        if (this.model[this.property] == undefined)
            this.model[this.property] = this.values[0];

        this.value = this.model[this.property];
    }
}

@Component({
    selector: 'enum-property',
    template: `
<select class="form-control" [(ngModel)]="value" (ngModelChange)="onChange($event)">
    <option *ngFor="let value of values" [ngValue]="value">{{value}}</option>
 </select>
`
})
export class EnumPropertyComponent {
    // instance data

    @Input()
    private model: any;
    @Input()
    private property : string;
    @Input("type")
    private type : AbstractEnumTypeDescriptor;

    private values;
    private value : any;

    // callbacks

    onChange(value) {
        this.model[this.property] = value;
    }

    // OnChanges

    ngOnChanges(changes: SimpleChanges): void {
        this.values = this.type.getValues();

        if (this.model[this.property] == undefined)
            this.model[this.property] = this.values[0];

        this.value = this.model[this.property];
    }
}

@Component({
    selector: 'attribute-editor',
    template: `
<table class="table-full table-condensed">
    <tbody>
    <tr *ngFor="let key of attributes">
        <td><label>{{key}}</label></td>
        <td>
            <div class="input-group">
                <input class="form-control input-sm" type="text"
                       [(ngModel)]="model.attributes[key]"/>
            <span class="input-group-btn">
                <div class="fancyButton">
                    <a class="btn btn-fluid" (click)="deleteAttribute(label)"><span class="glyphicon glyphicon-remove"></span></a>
                </div>
            </span>
            </div>
        </td>
    </tr>
    </tbody>
    <tfoot>
    <tr>
        <td></td>
        <td>
            <input class="form-control input-sm" type="text" (keyup.enter)="addAttribute(newAttributeName)"
                   [(ngModel)]="newAttributeName"
                   placeholder="name = value ⏎"/>
        </td>
    </tr>
    </tfoot>
</table>`
})
export class AttributeEditorComponent implements OnChanges, OnDestroy {
    // instance data

    @Input()
    private model: any;
    private newAttributeName;
    private attributes : string[];
    @Output() onChange : EventEmitter<any> = new EventEmitter();

    // callbacks

    addAttribute(input : string) {
        this.onChange.emit({
            model: this.model,
            attribute: 'attributes',
            newValue: this.model.attributes // TODO:..hmmm in place
        });

        const index = input.indexOf('=');

        if (index > -1) {
            let name = input.substring(0, index);
            let value = input.substring(index + 1);

            if (!this.model.attributes)
                this.model.attributes = {};

            this.model.attributes[name] = value;
            this.attributes.push(name);

            this.newAttributeName = "";
        }
    }

    deleteAttribute(attributeName) {
        this.onChange.emit({
            model: this.model,
            attribute: 'attributes',
            newValue: this.model.attributes // TODO:..hmmm in place
        });

        delete this.model.attributes[attributeName];

        this.attributes.splice(this.attributes.indexOf(attributeName), 1);
    }

    // OnChanges

    ngOnChanges(changes: SimpleChanges) {
        this.attributes = this.model.attributes ? Object.keys(this.model.attributes) : [];
    }

    // OnDestroy

    ngOnDestroy(): void {
        //if (this.attributes && Object.keys(this.attributes).length == 0)
        //    delete this.model.attributes;
    }
}


@Component({
    selector: 'property-editor',
    template: `
<div #container></div>`
})
export class PropertyEditorComponent implements OnInit, OnChanges {
    // instance data

    @ViewChild('container', {read: ViewContainerRef})
    private container: ViewContainerRef;
    @Input()
    private model: any;
    @Input()
    private attribute: string;
    @Input()
    private property : Property;
    private componentRef : ComponentRef<any>;

    @Output() onChange : EventEmitter<any> = new EventEmitter();

    // constructor

    constructor(private propertyEditorBuilder : PropertyEditorBuilder) {
    }

    // private

    private addComponent() {
        if (this.componentRef)
            this.componentRef.destroy();

        this.attribute = this.attribute ? this.attribute : this.property.name;

        let factory = this.propertyEditorBuilder.getFactory(this.property.type, this.attribute, this.property._editor);

        this.componentRef = this.container.createComponent(factory);

        // pass data

        let instance : any = this.componentRef.instance;

        instance.model = this.model;
        instance.type = this.property.type;
        instance.onChange = (newValue) => {
            this.onChange.emit({
                model: this.model,
                attribute: this.attribute,
                newValue: newValue
            });
        };

        //instance.__proto__ = this.model; // :-) // constructor.prototype!
    }

    // OnInit

    ngOnInit(): void {

    }

    // OnChanges

    ngOnChanges(changes: SimpleChanges) {
        // changes.prop contains the old and the new value...

        this.addComponent();
    }
}

@Component({
    selector: 'value-binding-editor',
    template: `
<div class="input-group">
   <!-- either a specific editor -->
    
   <div *ngIf="valueOrBinding.type == \'value\'">
      <property-editor [model]="valueOrBinding" (onChange)="changedValue($event)" [property]="property" [attribute]="'value'"></property-editor>   
   </div>
                        
   <!-- or the binding editor -->
   
   <input name="model" class="form-control" [(ngModel)]="valueOrBinding.value" *ngIf="valueOrBinding.type == \'binding\'"/>
                    
   <!-- the combo thing -->    
                    
   <div class="input-group-btn">        
      <button type="button" class="btn btn-fluid btn-default dropdown-toggle" data-toggle="dropdown">           
         <span *ngIf="valueOrBinding.type == \'value\'" class="glyphicon glyphicon-pencil"></span>           
         <span *ngIf="valueOrBinding.type == \'binding\'" class="glyphicon glyphicon-link"></span>     
      </button>
      
      <ul class="dropdown-menu dropdown-menu-right" role="menu">         
         <li><a (click)="switched(\'value\')"><span class="glyphicon glyphicon-pencil"></span></a></li>        
         <li><a (click)="switched(\'binding\')"><span class="glyphicon glyphicon-link"></span></a></li>
      </ul>
    </div>
</div>`
})
export class ValueOrBindingEditor implements OnInit , OnChanges{
    // data

    @Input('model')
    private model : any;
    @Input()
    private property : Property;

    private valueOrBinding: any;

    @Output() onChange : EventEmitter<any> = new EventEmitter();

    // constructor

    constructor() {
    }

    // callbacks

    changedValue(event) {
        this.onChange.emit({
            model: this.model,
            attribute: this.property.name,
            newValue: {type: 'value', value: event.newValue}
        });
    }

    switched(type) {
        // emit before the change

        this.onChange.emit({
            model: this.model,
            attribute: this.property.name,
            newValue: this.valueOrBinding // TODO Hmmm.....we change in place...is that correct?
        });

        this.valueOrBinding.type = type;
        let oldValue = this.valueOrBinding.value;
        let newValue;

        if ( type == 'binding')
            newValue = '';
        else
            newValue = this.property.createDefault().value;

        if (typeof newValue != typeof oldValue)
            this.valueOrBinding.value = newValue;
    }

    // OnInit

    ngOnInit(): void {
        this.valueOrBinding = this.model[this.property.name];
    }

    // OnChanges

    ngOnChanges(changes: SimpleChanges): void {
    }
}

@Component({
    selector: 'property-label',
    template: `
<label class="label-button-on-hover"  [tooltip]="property?._tooltip"[ngStyle]="custom ? {'font-style': 'italic' } : {'font-style': 'normal' }">{{property.name}}
    <!--button class="btn borderless btn-fluid" ng-if="custom" data-ng-click="reset()">
        <i class="fa fa-times"></i>
    </button-->
</label>`
})
export class PropertyLabelComponent {
    @Input()
    private model : any;
    @Input()
    private property : Property;

}

@Component({
    selector: 'editor-group',
    template: `
<div class="editor-group col-md-12" [ngClass]="{'open': open}" >
    <!-- the title -->
    
    <div class="title" (click)="toggle()">
        <span [ngClass]="{'glyphicon-chevron-down': open, 'glyphicon-chevron-right': !open}" class="glyphicon toggleIcon"></span> {{group.name}}
    </div>
    
    <!-- the body -->
    
    <div class="body" [hidden]="!open"> 
       <div class="col-md-12" *ngFor="let property of group.properties">
         <!-- label -->
            
         <property-label [property]="property" [model]="model"></property-label>
                
          <!-- editor -->
            
          <value-binding-editor *ngIf="property.allowBinding" [property]="property" [model]="model" (onChange)="changed($event)"></value-binding-editor>
            
          <property-editor *ngIf="!property.allowBinding" [property]="property" [model]="model" (onChange)="changed($event)"></property-editor>  
        </div>
    </div>
</div>
`
})
export class EditorGroupComponent {
    @Input()
    private group : any;
    @Input()
    private model : any;
    private open : boolean = true;
    @Output() onChange : EventEmitter<any> = new EventEmitter();

    // callbacks

    changed(event) { // model attribute newValue
        this.onChange.emit(event);
    }

    toggle() {
        this.open = !this.open;
    }
}

@Component({
    selector: 'component-editor',
    template: `
<div class="editor-groups">
   <editor-group *ngFor="let group of groups" [group]="group" [model]="model" (onChange)="changed($event)"></editor-group>
</div>`
})
export class ComponentEditorComponent implements OnChanges {
    // instance data

    @Input()
    private model: any;

    private component : UIComponent;
    private groups : any[];

    @Output() onChange : EventEmitter<any> = new EventEmitter();

    // constructor

    constructor(private componentRegistry : ComponentRegistry) {
    }

    // events

    changed(event) { // model attribute newValue
        this.onChange.emit(event);
    }

    // private

    buildGroups(properties : Property[]) : any[] {
        let result = [];

        let map = {};

        for (let property of properties)
            if (!property.isArtificial) {
                let group = map[property.group];

                if (!group) {
                    group = {
                        name: property.group,
                        properties: []
                    };

                    map[property.group] = group;

                    result.push(group);
                } // if

                group.properties.push(property); // what about sorting?
            }

        return result;
    }

    // OnChanges

    ngOnChanges(changes: SimpleChanges) : void {
        if (this.model) {
            this.component = this.componentRegistry.find(this.model.id);
            this.groups = this.buildGroups(this.component.getProperties());
        }
        else this.groups = [];
    }
}
