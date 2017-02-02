import {
    Component,
    AfterViewInit,
    SkipSelf,
    Optional,
    forwardRef,
    Inject,
    Input,
    Injectable,
    ComponentFactory,
    Compiler,
    NgModule,
    ViewContainerRef,
    ViewChild,
    ComponentRef,
    OnChanges,
    SimpleChanges,
    OnDestroy, ElementRef
} from "@angular/core";

import {DragSource, DropTarget} from "../ui/ui-dd.class";
import {Shortcut} from "../ui/ui-shortcut";
import {AppModule} from "../app.module";

@Injectable()
export class TreeComponentBuilder {
    // instance data

    private factories : Map<string,ComponentFactory<any>> = new Map<string,ComponentFactory<any>>();

    // constructor

    constructor(private compiler: Compiler) {
    }

    private buildFactory(template : string) : ComponentFactory<any> {
        @Component({
            inputs: [],
            template: template
        })
        class TemplateComponent {
        }

        // the module

        @NgModule({
            imports: [AppModule], // TODO
            declarations: [TemplateComponent]
        })
        class TemplateModule {
        }

        // compile and create

        let module = this.compiler.compileModuleAndAllComponentsSync(TemplateModule);

        return module.componentFactories.find((comp) =>
            comp.componentType === TemplateComponent
        );
    }

    // public

    public getFactory(template : string) : ComponentFactory<any> {
        let factory = this.factories.get(template);
        if (!factory)
            this.factories.set(template, factory = this.buildFactory(template));

        return factory;
    }
}


// node content

@Component({
    selector: 'node-content',
    template: '<span id="container" #container></span>'
})
export class NodeContent implements OnChanges {
    // instance data

    @Input()
    private node;
    private componentRef : ComponentRef<any>;
    @ViewChild('container', {read: ViewContainerRef})
    private container: ViewContainerRef;

    // constructor

    constructor(private treeComponentBuilder: TreeComponentBuilder) {
    }

    // private

    template() {
        return this.node.tree.model.label || '';
    }

    // OnChanges

    ngOnChanges(changes: SimpleChanges) {
        // changes.prop contains the old and the new value...

        this.render();
    }


    render() {
        if (this.componentRef)
            this.componentRef.destroy();

        let factory = this.treeComponentBuilder.getFactory(this.template());

        this.componentRef = this.container.createComponent(factory);

        // pass data

        let instance : any = this.componentRef.instance;

        instance.__proto__ = this.node.tree.model.context; // :-) // constructor.prototype!

        instance.node  = this.node;
        instance.model = this.node.model;
    }
}

// tree node

@Component({
    selector: '[treeNode]',
    template: `
<div class="level" [ngClass]="{'active': isSelected, 'node-expanded': hasChildren() && isExpanded, 'node-collapsed': hasChildren() && !isExpanded}">
    <!-- toggle -->

    <span *ngIf="hasChildren()" class="toggle" (click)="toggle()">
    </span>
     <span *ngIf="!hasChildren()" class="toggle-placeholder">
    </span>

    <!-- content -->

    <a (click)="select()">
       <node-content [node]="self"></node-content>
    </a>
</div>

<!-- children -->

<div *ngIf="isExpanded || children" [hidden]="!isExpanded">
    <li treeNode *ngFor="let child of model.children" [model]="child"></li>
</div>

<!--div *ngIf="isExpanded">
  <li treeNode *ngFor="let child of model.children" [model]="child"></li>
</div-->
`
})
export class TreeNode implements DragSource, DropTarget, OnChanges, OnDestroy {
    // implement DragSource

    create(): any {
        return this.model;
    }

    // implement DropTarget

    dropAllowed(object) : boolean {
        return this.tree.model.dropAllowed ?  this.tree.model.dropAllowed(object, this.model) : true;
    }

    dropped(object : any) : any {
        if (this.tree.model.dropped)
            this.tree.model.dropped(object, this.model);
    }

    // instance data

    tree : TreeComponent;
    parent : TreeNode;
    @Input()
    public model : any;
    isSelected : boolean;
    public isExpanded : boolean;
    public children : TreeNode[] = undefined;

    self = this;

    // constructor

    constructor(@Inject(forwardRef(() => TreeComponent)) tree,  @SkipSelf() @Optional() parent : TreeNode) {
        this.tree = tree;
        this.parent = parent;
        //this.children = [];

        if (parent)
            parent.addChild(this);
        else
            tree.addChild(this);

        let state = tree.findState(this);

        this.isSelected = state ? state.isSelected : false;
        this.isExpanded = state ? state.isExpanded : false;

        if (this.isSelected)
            tree.currentSelection = this;
    }

    addChild(child : TreeNode) {
        if (!this.children)
            this.children = [];

        this.children.push(child);
    }

    index() : number {
        if (this.parent)
            return this.parent.children.indexOf(this);
        else
            return this.tree.children.indexOf(this);
    }

    removeChild(child : TreeNode) {
        this.children.splice(this.children.indexOf(child), 1);
    }

    destroyed() {
        if (this.parent)
            this.parent.removeChild(this);
        else
            this.tree.removeChild(this);
    }

    nextChild(child : TreeNode) : TreeNode {
        let index = this.children.indexOf(child);
        if (index < this.children.length - 1)
            return this.children[index + 1];

        return undefined;
    }

    prevChild(child : TreeNode) : TreeNode {
        let index = this.children.indexOf(child);
        if (index > 0) {
            let previous =  this.children[index - 1];

            if (previous.isExpanded && previous.children.length > 0)
                return previous.children[previous.children.length - 1];

            return previous;
        }

        return undefined;
    }

    // methods

    isLeaf() : boolean {
        return !this.model.children || this.model.children.length == 0;
    }

    hasChildren() : boolean {
        return  this.model.children && this.model.children.length;
    }

    // keys

    onLeft(event) {
        if (this.hasChildren() && this.isExpanded)
            this.isExpanded = !this.isExpanded;
    }

    onRight(event) {
        if (this.hasChildren() && !this.isExpanded)
            this.isExpanded = !this.isExpanded;
    }

    onUp(event) {
        //event.stopPropagation();

        if (this.parent)
            if (this.parent.prevChild(this))
                this.parent.prevChild(this).select();

            else
                this.parent.select();
    }

    onDown(event) {
        //event.stopPropagation();

        let down = (node : TreeNode, followChildren : boolean) => {
            if (node.isExpanded && followChildren)
                node.children[0].select();

            else if (node.parent && node.parent.nextChild(node))
                node.parent.nextChild(node).select();

            else if (node.parent) {
                down(node.parent, false);
            }
        };

        down(this, true);
    }

    // callbacks

    select() {
        this.tree.onSelect(this);
    }

    toggle() : void {
        if (!this.isExpanded)
            this.tree.onExpand(this);
        else
            this.tree.onCollapse(this);

        this.isExpanded = !this.isExpanded;
    }

    ngOnInit() {
        //console.log('create tree node ' + this.model.label);
    }

    // OnDestroy

    ngOnDestroy() {
        this.destroyed();
    }

    // OnChanges

    ngOnChanges(changes: SimpleChanges) {
        // changes.prop contains the old and the new value...

        if (this.tree.currentSelection && this.tree.currentSelection.model === this.model) {
            this.isSelected = true;

            this.tree.currentSelection = this;
        }
    }
}

// the tree

@Component({
    selector: 'tree',
    host: {
        'style': 'height: 100%'
    },
    template: `
<ul #ul tabindex="0" class="tree" (blur)="onFocus(false)" (focus)="onFocus(true)">
  <li treeNode *ngFor="let node of model.root" [model]="node"></li>
</ul>`

    //directives: [TreeNode]
})
export class TreeComponent implements OnChanges, AfterViewInit, OnDestroy {
    // instance data

    @Input('model')
    public model : any;

    @ViewChild("ul")
    private ul: ElementRef;


    children : TreeNode[] = [];
    currentSelection : TreeNode;
    private hasFocus = false;

    private onDelete : Function[] = [];

    stateMap : Map<TreeNode,any> = new Map<TreeNode,any>(); // actually a temporary thing


    // constructor

    constructor(shortcuts : Shortcut) {
        // register shortcuts

        this.onDelete.push(shortcuts.register({
            shortCut: 'left',
            handles: (event) => {return this.hasFocus && this.currentSelection},
            action: () => {
                this.currentSelection.onLeft(event);
            },
        }));

        this.onDelete.push(shortcuts.register({
            shortCut: 'right',
            handles: (event) => {return this.hasFocus && this.currentSelection},
            action: () => {
                this.currentSelection.onRight(event);
            },
        }));

        this.onDelete.push(shortcuts.register({
            shortCut: 'up',
            handles: (event) => {return this.hasFocus && this.currentSelection},
            action: () => {
                this.currentSelection.onUp(event);
            },
        }));

        this.onDelete.push(shortcuts.register({
            shortCut: 'down',
            handles: (event) => {return this.hasFocus && this.currentSelection},
            action: () => {
                this.currentSelection.onDown(event);
            },
        }));
    }

    // callbacks

    onFocus(focus : boolean) {
        //console.log("focus " + focus);
        this.hasFocus = focus;
    }

    // private

    // called by ancestors
    addChild(child : TreeNode) {
        this.children.push(child);
    }

    removeChild(child : TreeNode) {
        this.children.splice(this.children.indexOf(child), 1);
    }

    // OnChanges

    ngOnChanges(changes: SimpleChanges) {
        // changes.prop contains the old and the new value...
    }

    // OnDestroy

    ngOnDestroy(): void {
        for (let onDelete of this.onDelete)
            onDelete();
    }

    // AfterViewInit

    ngAfterViewInit(): void {
        this.model.tree = this;

        this.model.onSelect.subscribe((component) => {
            this.selectNode(component);
        });
    }

    // private

    private findNode4(model : any) : TreeNode {
        let stack : TreeNode[] = [];
        for (let child of this.children)
            stack.push(child);

        let result = undefined;
        while (stack.length > 0) {
            let node = stack.shift();

            if (node.model === model)
                return node;

            else {
                if (node.children)
                    for (let child of node.children)
                        stack.push(child);
            }
        } // while

        return result;
    }

    // public

    public findState(node : TreeNode) : any {
        let state = this.stateMap.get(node);
        if (!state) {
            let parentState;
            if (node.parent)
                parentState = this.findState(node.parent);
            else
                parentState = this.model.state;

            state = parentState && parentState.children ? parentState.children[node.index()] : undefined;

            if (state)
                this.stateMap.set(node, state);
        }

        return state;
    }

    public getState() : any {
        let state = {
            children: []
        };


        function get(tree : TreeComponent, node : TreeNode, state : any) {
            state.isSelected = node.isSelected;
            state.isExpanded = node.isExpanded;

            if (node.isSelected)
                tree.currentSelection = node;

            if (node.children && node.children.length > 0) {
                state.children = [];

                for ( let child of node.children) {
                    let childState = {};

                    state.children.push(childState);

                    get(tree, child, childState);
                } // for
            } // if
        }

        // root

        for (let child of this.children) {
            let childState = {};

            state.children.push(childState);

            get(this, child, childState);
        }

        return state;
    }

    // we assume that the model is the same...

    public restoreState(state : any) {
        // local function

        function restore(node : TreeNode, state : any) {
            node.isSelected = state.isSelected; // currentSelection?

            let wasExpanded = node.isExpanded;
            node.isExpanded = state.isExpanded;

            if (!wasExpanded) {
                setTimeout(() => {restore(node, state)}); // tree needs to get constructed first :-)
            }
            else {
                if (state.children && state.children.length > 0) {
                    let i = 0;
                    for (let childState of state.children) {
                        restore(node.children[i++], childState);
                    } // for
                } // if
            }
        }

        if (state.children) {
            let i = 0;
            for (let childState of state.children)
                restore(this.children[i++], childState);
        } // if
    }

    public selectNode(model : any) {
        if (this.currentSelection)
            this.currentSelection.isSelected = false;

        let treeNode = this.findNode4(model);

        if (treeNode)
            treeNode.isSelected = true;

        this.currentSelection = treeNode;
    }

    public expandPath(path: any[]) {
        let self = this;

        function expand(node : TreeNode, path : any[], index : number) {
            if (index < path.length) {
                if (!node.isExpanded) {
                    node.isExpanded = true;

                    setTimeout(() => {expand(node, path, index)}, 0);
                }
                else {
                    for (let child of node.children)
                        if (child.model === path[index]) {
                            expand(child, path, index + 1);
                        }
                } // else
            }
            else {
                self.onSelect(node);
            }
        }

        for (let child of this.children)
            if (child.model === path[0]) {
                expand(child, path, 1);
                break;
            }
    }

    // internal callbacks

    onSelect(node : TreeNode) { //this.ul.nativeElement.focus();
        if (this.currentSelection !== node) {
           if (this.currentSelection)
               this.currentSelection.isSelected = false;

            if (node) {
                node.isSelected = true;
            }

            this.currentSelection = node;

            if (this.model.onSelect)
                this.model.onSelect.emit(node ? node.model : undefined);
        } // if
    }

    onExpand(node : TreeNode) {
        if (this.model.onExpand)
            this.model.onExpand(node.model);
    }

    onCollapse(node : TreeNode) {
        if (this.model.onCollapse)
            this.model.onCollapse(node.model);
    }
}
