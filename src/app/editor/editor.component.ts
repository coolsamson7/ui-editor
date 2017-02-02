import {Input, Component, OnDestroy, HostListener} from "@angular/core";
import {ComponentRegistry} from "./editor-component.class";
import {Shortcut} from "../ui/ui-shortcut";
import {EditComponent} from "./editor-edit-component.component";
import {EditorActionHistory} from "./editor-history.class";


// base class for all nodes

export class Editable {
    // instance data

    //@Input()
    public model : any;

    selected : boolean = false;
    parent : Editable;
    children: Editable[] = [];

    // constructor

    constructor(model : any, parent: Editable) {
        this.model = model;
        this.parent = parent;
        if (this.parent)
            parent.addChild(this);
    }

    // protected

    destroyed() {
        if (this.parent)
            this.parent.removeChild(this);
    }

    addChild(child : Editable) : void {
        this.children.push(child);
    }

    removeChild(child : Editable) : void {
        this.children.splice(this.children.indexOf(child), 1);
    }

    onLeft(event) {}
    onRight(event) {}
    onDelete(event) {}
}


//

@Component({
    selector: 'editor',
    template: `
<div tabindex="0" class="form-editor"  (blur)="onFocus(false)" (focus)="onFocus(true)">
    <edit-component [model]="model" [context]="context"></edit-component>
    <xbread-crumb *ngIf="selection" [steps]="steps" (onClick)="clickedBreadcrumb($event)"></xbread-crumb>
</div>
   `
})
export class EditorComponent extends Editable implements OnDestroy {
    // data

    @Input('root')
    public set root(root: any) {
        this.model = root;
    }
    @Input('context') context: any;
    @Input('onSelection') onSelection;

    @Input()
    history : EditorActionHistory;

    selection : Editable;

    hasFocus : boolean = false;

    private onDestroy : Function[] = [];

    private steps = [];

    // constructor

    constructor(public componentRegistry : ComponentRegistry, private shortcut : Shortcut) {
        super(undefined, undefined); // will be set afterwards...

        // shortcuts

        this.onDestroy.push(shortcut.register({
            shortCut: 'left',
            handles: (event) => {return this.hasFocus && this.selection},
            action: () => {
                this.selection.onLeft(event)
            },
        }));

        this.onDestroy.push(shortcut.register({
            shortCut: 'right',
            handles: (event) => {return this.hasFocus && this.selection},
            action: () => {
                this.selection.onRight(event)
            },
        }));

        this.onDestroy.push(shortcut.register({
            shortCut: 'up',
            handles: (event) => {return this.hasFocus && this.selection},
            action: () => {
                this.selection.onLeft(event)
            },
        }));

        this.onDestroy.push(shortcut.register({
            shortCut: 'down',
            handles: (event) => {return this.hasFocus && this.selection},
            action: () => {
                this.selection.onRight(event)
            },
        }));

        this.onDestroy.push(shortcut.register({
            shortCut: 'delete',
            handles: (event) => {return this.hasFocus && this.selection},
            action: () => {
                this.selection.onDelete(event)
            },
        }));

        this.onDestroy.push(shortcut.register({
            shortCut: 'meta+key:90',
            handles: (event) => {return true;},
            action: () => {
                this.history.undo();
            },
        }));
    }

    // callbacks

    breadCrumb() {
        let breadcrumb = [];

        if (this.selection) {
            let component = this.selection.model;

            while (component) {
                breadcrumb.unshift({component: component, label: component.id});

                component = component.$parent;
            } // while
        } // if

        return breadcrumb;
    }

    clickedBreadcrumb(breadcrumb : any) {
        let component = breadcrumb.component;

        this.onSelect(this.findComponent(component));
    }


    onFocus(focus : boolean) {
        this.hasFocus = focus;
    }

    // private

    public findComponent(model: any) : Editable {
        let stack : Editable[] = [];
        for (let child of this.children)
            stack.push(child);

        let result = undefined;
        while (stack.length > 0) {
            let node = stack.shift();

            if (node.model === model)
                return node;

            else {
                for (let child of node.children)
                    stack.push(child);
            }
        } // while

        return result;
    }

    // TODO move to the application level...
    @HostListener('window:keydown', ['$event'])
    handleKeyDown($event) {
        this.shortcut.handle(event);
    }

    // public

    public select(component: any) {
        if (this.selection)
            this.selection.selected = false;

        let editable = this.findComponent(component);

        if (editable)
            editable.selected = true; // will not trigger callback...

        this.selection = editable;

        this.steps = this.breadCrumb();
    }

    // private

    private reorder(parent : any, i1 : number, i2 : number) {
        this.history.reorderChild(parent, i1, i2);
    }

    // called by the individual component

    reparent(component: any, model: any) {
        if (component.$parent)
            this.history.reparent(component, model);
        else
            this.history.created(component, model);
    }

    deleted(component : Editable) {
        this.history.deleted(component.model);

        this.onSelect(undefined);
    }

    moveLeft(editComponent: EditComponent) {
        if (editComponent.parent) {
            let index = editComponent.parent.model.children.indexOf(editComponent.model);
            if (index > 0)
                this.reorder(editComponent.parent.model, index, index - 1);
        }
    }

    moveRight(editComponent: EditComponent) {
        if (editComponent.parent) {
            let index = editComponent.parent.model.children.indexOf(editComponent.model);
            if (index < editComponent.parent.model.children.length - 1)
                this.reorder(editComponent.parent.model, index, index + 1);
        }
    }

    onSelect(component : Editable) {
        // deselect

        if (this.selection)
            this.selection.selected = false;

        // select

        if (component)
            component.selected = true;

        this.selection = component;

        this.steps = this.breadCrumb();

        // emit

        this.onSelection.emit(component ? component.model : undefined);
    }

    // AfterViewInit

    ngAfterViewInit(): void {
        // react to selection changes

        this.onSelection.subscribe((component) => {
            this.select(component);
        });
    }

    // OnDestroy

    ngOnDestroy(): void {
        for (let onDelete of this.onDestroy)
            onDelete();
    }
}
