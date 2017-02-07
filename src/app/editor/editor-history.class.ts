import {EditorService} from "./editor-service";
import {EditComponent} from "./editor-edit-component.component";


export interface Action {
    push();

    revert() : void;

    remove() : void;
}

export class ActionHistory {
    // instance data

    history : Array<Action> = [];

    // public

    public isDirty() : boolean {
        return this.history.length > 0;
    }

    public undo() {
        if (this.history.length > 0) {
            this.history[0].revert();
            this.history.splice(0, 1);
        } // if
    }

    public clear() {
        this.history = [];
    }

    public revert() : void {
        for (let action of this.history)
            action.revert();

        this.history = [];
    }

    public push(action : Action) : ActionHistory {
        action.push(); // before pushing to array

        this.history.unshift(action);

        return this;
    }
}


export abstract class AbstractAction implements Action {
    // instance data

    name : string;
    history : ActionHistory;

    // constructor

    constructor(history : ActionHistory, name : string) {
        this.name = name;
        this.history = history;
    }

    // methods

    abstract revert() : void;

    push() {
    }


    remove() : void {
        let index = this.history.history.indexOf(this);
        this.history.history.splice(index, 1);
    }
}

// changed properties

export class ModificationAction extends AbstractAction {
    // instance data

    object : any;
    original : any;
    editorService : EditorService;

    // constructor

    constructor(history : ActionHistory, name : string, editorService : EditorService, object : any, original : any) {
        super(history, name);

        this.object = object;
        this.original = original;
        this.editorService = editorService;
    }

    // public

    isValid() : boolean {
        return this.editorService.diff(this.original, this.object);
    }

    // override

    revert() : void {
        this.editorService.copyProperties(this.original, this.object);
    }
}

// reparenting

export class ReparentAction extends AbstractAction {
    // instance data

    component : any;
    oldParent : any;
    newParent : any;

    // constructor

    constructor(history : ActionHistory, name : string = "reparent", component : any, newParent : any) {
        super(history, name);

        this.component = component;
        this.oldParent = component.$parent;
        this.newParent = newParent;
    }

    // override

    push() {
        super.push();

        // execute

        if (this.component.$parent) {
            let index = this.component.$parent.children.indexOf(this.component);

            this.component.$parent.children.splice(index, 1);
        }

        if (this.newParent) {
            this.newParent.children.push(this.component);
            this.component.$parent = this.newParent;
        }
    }

    revert() : void {
        if (this.component.$parent) {
            let index = this.component.$parent.children.indexOf(this.component);

            this.component.$parent.children.splice(index, 1);
        }

        if (this.oldParent) {
            this.oldParent.children.push(this.component);
            this.component.$parent = this.oldParent;
        }
    }
}

// moving child

export class ReorderChildAction extends AbstractAction {
    // instance data

    object : any;
    i1 : number;
    i2 : number;

    // constructor

    constructor(history : ActionHistory, name : string = "move", object : any, i1 : number, i2 : number) {
        super(history, name);

        this.object = object;
        this.i1 = i1;
        this.i2 = i2;
    }

    // private

    private swap(array : any[], i1 : number, i2 : number) : void {
        let temp = array[i1];
        array[i1] = array[i2];
        array[i2] = temp;
    }

    // override

    push() {
        super.push();

        // execute

        this.swap(this.object.children, this.i1, this.i2);

    }

    revert() : void {
        this.swap(this.object.children, this.i1, this.i2);
    }
}

// create

export class CreateAction extends AbstractAction {
    // instance data

    object : any;
    parent : any;

    // constructor

    constructor(history : ActionHistory, name : string = "create", object : any, parent : any) {
        super(history, name);

        this.object = object;
        this.parent = parent;
    }

    // override

    push() {
        super.push();

        // execute

        this.parent.children.push(this.object);
        this.object.$parent = this.parent;
    }

    revert() : void {
        let index = this.parent.children.indexOf(this.object);

        this.parent.children.splice(index, 1);
    }
}

// delete

export class DeleteAction extends AbstractAction {
    // instance data

    oldParent : any;
    index : number;
    object : any;

    // constructor

    constructor(history : ActionHistory, name : string = "delete", object : any) {
        super(history, name);

        this.object = object;
    }

    // override

    push() {
        super.push();

        // execute

        this.oldParent = this.object.$parent;
        this.index = this.object.$parent.children.indexOf(this.object);

        this.object.$parent.children.splice(this.index, 1);
        this.object.$parent = undefined;
    }

    revert() : void {
        if (this.object.$parent) {
            this.object.$parent.children.splice(this.object.$parent.children.indexOf(this.object), 1);
            this.object.$parent = undefined;
        }

        this.object.$parent = this.oldParent;
        if (this.oldParent)
            this.oldParent.children.splice(this.index, 0, this.object);
    }
}

export class EditorActionHistory extends ActionHistory {
    // instance data

    private editorService : EditorService;
    private modificationAction : ModificationAction;
    private currentComponent : EditComponent;
    private copy : any;

    // constructor

    constructor(editorService : EditorService) {
        super();

        this.editorService = editorService;
    }

    // private

    public pushAction(change : Action) : void {
        this.push(change);

        if (change instanceof ModificationAction)
            this.modificationAction = <ModificationAction>change;

        else {
            this.modificationAction = undefined;
            if (this.currentComponent)
                this.copy = this.editorService.copyModel(this.currentComponent.model, false); // make a local copy of the model not including parent and children
        }
    }

    private rememberChange(object : any, original : any) {
        this.pushAction(new ModificationAction(
            this,
            "property change",
            this.editorService,
            object,
            original
        ));
    }

    // public

    public select(selection : EditComponent) {
        if (this.currentComponent)
            this.currentComponent.component.onChange = undefined;

        this.currentComponent = selection;

        this.copy = undefined;
        this.modificationAction = undefined;

        if (this.currentComponent) {
            this.copy = this.editorService.copyModel(this.currentComponent.model, false); // make a local copy of the model not including parent and children

            this.currentComponent.component.onChange = () => {
                this.objectChanged(this.currentComponent.model, this.copy)
            };
        } // if
    }

    public objectChanged(object : any, original : any) {
        if (this.currentComponent)
            if (!this.modificationAction)
                this.rememberChange(object, original);

            else if (!this.modificationAction.isValid()) {
                this.modificationAction.remove();
                this.modificationAction = undefined;
            } // else
    }

    // high level methods

    public reparent(component : any, newParent : any) {
        this.pushAction(new ReparentAction(this, "reparent", component, newParent))
    }

    public created(component : any, parent : any) {
        this.pushAction(new CreateAction(this, "create", component, parent));
    }

    public deleted(component : any) {
        this.pushAction(new DeleteAction(this, "delete", component));
    }

    public reorderChild(parent : any, i1 : number, i2 : number) {
        this.pushAction(new ReorderChildAction(this, "reorder", parent, i1, i2))
    }
}
