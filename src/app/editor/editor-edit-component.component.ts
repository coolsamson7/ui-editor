import {
    ComponentRef,
    Directive,
    Input,
    SimpleChanges,
    DoCheck,
    ViewContainerRef,
    OnChanges,
    Component,
    ViewChild,
    Optional,
    Injectable,
    SkipSelf,
    OnDestroy
} from "@angular/core";
import {ChangeDetector} from "./editor-change-detector";
import {UIComponent, ComponentFactoryBuilder, ComponentRegistry} from "./editor-component.class";
import {EditorComponent, Editable} from "./editor.component";


// base class for all nodes

@Directive({
    selector: 'component'
})
export class ComponentDirective implements OnChanges, DoCheck, OnDestroy {
    // instance data

    @Input('model')
    private model : any;
    @Input('context') context: any;
    private component : UIComponent;
    private componentRef : ComponentRef<any>;
    private changeDetector : ChangeDetector;
    public editable : Editable;
    self = this;

    // constructor

    constructor(private container: ViewContainerRef, private componentBuilder : ComponentFactoryBuilder, private componentRegistry : ComponentRegistry) {
    }

    // private

    public update() {
        if (this.componentRef)
            this.componentRef.destroy();

        let factory = this.componentBuilder.buildFactory(this.component.render(this.model, true));

        this.componentRef = this.container.createComponent(factory);

        // pass data

        let instance : any = this.componentRef.instance;

        instance.__proto__ = this.context; // :-) // constructor.prototype!
        instance._model = this.model; // allow {{$model.value}}
        instance.PROP = (prop : string) => {
            let property = this.component.findProperty(prop);

            let value = property.valueOf(this.model);
            if (property.allowBinding) {
                if (value && value.type == "value")
                    value = value.value;
                else
                    value = "{{" + value.value + "}}";
            }

            return value.toString();
        };

        instance.foo = "FOO";

        instance.children = this.model.children;

        // decorations?

        let comp : any =  this.componentRef;
        let ngComp = comp._hostElement.elementRef.nativeElement;

        this.component.decorate(this.model, ngComp.firstChild);

        this.componentRef.changeDetectorRef.detectChanges(); // good for what?
    }

    private static increaseCounter(model : any) {
        if (model.$counter)
            model.$counter = model.$counter + 1;
        else
            model.$counter = 1;
    }

    public onChange : () => void;

    private triggerChange() {
        if (this.onChange)
            this.onChange();
    }

    // DoCheck

    ngDoCheck() {
        if (!this.componentRef || this.changeDetector.check(this.model)) {
            this.triggerChange();

            if (this.componentRef && this.model.id == "col")
                ComponentDirective.increaseCounter(this.model.$parent);  // HACK to force the row to be updated
             else
                 this.update();
        } // if
    }

    // OnChanges

    ngOnChanges(changes: SimpleChanges) {
        this.component = this.componentRegistry.find(this.model.id);
        this.component.setupChangeDetector(this.changeDetector = new ChangeDetector(), this.model);

        // ETST

        this.update();
        this.triggerChange();
    }

    // OnDestroy

    ngOnDestroy() {
    }
}



@Injectable()
@Component({
    selector: 'edit-component',
    host: {
        'display': 'inline-block'
    },
    template: `
<div [ngClass]="{'form-edit': model.id != 'row' && model.id != 'col', 'active': selected}" (click)="onClick($event)" drop-target [dropEnabled]="true" [allowDrop]="_dropAllowed" (dropped)="_dropped($event)">
    <!-- handles -->
    
    <span *ngIf="selected" class="form-header">{{model.id}}</span>
    <span *ngIf="selected" [confirm]="confirm" class="form-delete glyphicon glyphicon-remove"></span>
    <span *ngIf="visible('l')" (click)="onLeft($event)"   class="grip form-left glyphicon glyphicon-arrow-left" [ngClass]="{'active': active('l')}"></span>
    <span *ngIf="visible('r')" (click)="onRight($event)"  class="grip form-right glyphicon glyphicon-arrow-right" [ngClass]="{'active': active('r')}"></span>
    <span *ngIf="visible('u')" (click)="onLeft($event)"   class="grip form-up glyphicon glyphicon-arrow-up" [ngClass]="{'active': active('u')}"></span>
    <span *ngIf="visible('d')" (click)="onRight($event)"  class="grip form-down glyphicon glyphicon-arrow-down" [ngClass]="{'active': active('d')}"></span>
    
    <!-- the root component -->
    
    <component [model]="model" [context]="context"></component>
</div>
`//,
  //inputs: ['model']
})
export class EditComponent extends Editable implements OnChanges, OnDestroy {
    // input

    @Input('model')
    public set _model(model: any) {
        this.model = model;
    }
    @Input('context') context: any;

    @ViewChild(ComponentDirective) component : ComponentDirective;

    _dropped : (any) => void = this.dropped.bind(this) ;
    _dropAllowed : (any) => boolean  = this.dropAllowed.bind(this) ;


    private confirm : any;

    // data

    // constructor

    constructor(private editor : EditorComponent, @SkipSelf() @Optional() parent : EditComponent) {
        super(undefined, parent ? parent : editor);

        this.confirm = {
            position: 'right',
            ok: "Yes",
            cancel: "No",
            title: "Delete Node",
            message: "Really delete?",
            onOk: () => {
                this.onDelete(undefined);
            },
            onCancel: () => {},
        };
    }

    // private

    private isChildOf(component : any) : boolean {
        let node : Editable = this.parent;
        while ( node ) {
            if (node.model === component)
                return true;

            node = node.parent;
        } // while

        return false;
    }

    // public

    // l r u d
    visible(part : string) : boolean {
        if (!this.selected)
            return false;

        if (this.model.id == "row")
            return part == "u" || part == "d";

        if (this.model.id == "col")
            return part == "l" || part == "r";

        // nope

        return false;
    }

    active(part : string) : boolean {
        if (!this.parent)
            return false;

        let index = this.parent.model.children.indexOf(this.model);

        if (part == 'l' || part == 'u')
            return index > 0;

        else if (part == 'r' || part == 'd')
            return index < this.parent.model.children.length - 1;

        return false;
    }

    dropAllowed(component) : boolean {
        if (component) {
            if (this.isChildOf(component))
                return false;

            let descriptor = this.editor.componentRegistry.find(component.id);

            return descriptor.isValidParent(this.model.id);
        } // if

        return false;
    }

    dropped(component) : void {
        // detach from old parent

        this.editor.reparent(component, this.model);

        //if (component.$parent) {
        //    let index = component.$parent.children.indexOf(component);

       //     component.$parent.children.splice(index, 1);
        //}

        // add to new parent

        //this.model.children.push(component); component.$parent = this.model;

        setTimeout(() => {
            this.editor.onSelect(this.editor.findComponent(component));
        }, 0);
    }

    onDelete(event) {
        if (event)
            event.stopPropagation();

        this.editor.deleted(this);

        //if (this.parent) {
        //    this.parent.model.children.splice(this.parent.model.children.indexOf(this.model), 1);
        //    this.model.$parent = undefined;

        //    this.editor.onSelect(undefined);
        //}
    }

    onLeft(event) {
        event.stopPropagation();

        this.editor.moveLeft(this);

        //if (this.parent) {
        //    let index = this.parent.model.children.indexOf(this.model);
        //    if (index > 0)
        //        this.swap(this.parent.model.children, index, index - 1);
        //}
    }

    onRight(event) {
        event.stopPropagation();

        this.editor.moveRight(this);

        //if (this.parent) {
        //    let index = this.parent.model.children.indexOf(this.model);
        //    if (index < this.parent.model.children.length - 1)
        //        this.swap(this.parent.model.children, index, index + 1);
        //}
    }

    onClick(event) {
        event.stopPropagation();

        this.editor.onSelect(this);
    }

    // OnChanges

    ngOnChanges(changes: SimpleChanges) {
        this.component.editable = this;

        if (this.editor.selection && this.editor.selection.model === this.model) {
            this.editor.selection = this;
            this.selected = true;
        }
    }

    // OnDestroy

    ngOnDestroy() {
        this.destroyed();
    }
}
