import {
    Input,
    SimpleChanges,
    ViewContainerRef,
    OnChanges,
    Component,
    ViewChild,
    Injectable,
    EventEmitter,
    ComponentFactory,
    ComponentRef,
    TemplateRef,
    ComponentFactoryResolver, Injector, ChangeDetectorRef, OnDestroy
} from "@angular/core";
import {FloaterContainer, Floater, Floating} from "../widgets/widgets-floater";
import {EditorComponent} from "./editor.component";
import {RenderComponent} from "./editor-render-component.component";
import {Tabs, Tab} from "../widgets/widgets-tabs";
import {ComponentRegistry, UIComponent} from "./editor-component.class";
import {EditorService} from "./editor-service";
import {MenuBuilder} from "../widgets/widgets-context-menu";
import {EditComponent} from "./editor-edit-component.component";
import {ReparentAction, EditorActionHistory} from "./editor-history.class";
import {ToastService} from "../widgets/widgets-toast";
import {ChangeDetector} from "./editor-change-detector";
import {Shortcut} from "../ui/ui-shortcut";
import {NgbActiveModal, NgbModalRef, NgbModal} from "@ng-bootstrap/ng-bootstrap";


// TODO

export class Dialog implements OnDestroy {
    // callbacks

    public buttons : any = [];
    public activeModal: NgbActiveModal;
    private shortcut : Shortcut;

    // constructor

    constructor(private injector: Injector) {
        this.activeModal = injector.get(NgbActiveModal);
        this.shortcut    = injector.get(Shortcut);

        this.shortcut.addLayer();
    }

    // protected

    protected addButton(command : any) {
        if (command.shortCut)
            this.shortcut.register({
                shortCut: command.shortCut,
                action: () => {this.executeCommand(command);}
            });

        this.buttons.push(command);
    }

    // private

    private cancelCommand() {
        return this.buttons.find((button)=>button.isCancel);
    }

    private defaultCommand() {
        return this.buttons.find((button)=>button.isDefault);
    }

    private executeCommand(command : any) {
        let result = command.run();

        this.activeModal.close(result);
    }

    // callbacks

    private close() {
        let cancel = this.cancelCommand();
        if (cancel)
            this.executeCommand(cancel);
        else
            this.activeModal.close(undefined);
    }

    private clicked(command : any) {
       return this.executeCommand(command);

        //this.activeModal.close(result);
    }

    private label(command : any) : string {
        return command.label;
    }

    // OnDestroy

    ngOnDestroy() {
        this.shortcut.removeLayer();
    }
}

@Component({
    selector: 'open-file-dialog',
    //templateUrl: '/portal/template/demo/openFile.html' // TODO -> add dialog stuff
  template: `
<div layout:fragment="body">
    <input type="file" (change)="fileChangeEvent($event)" placeholder="Upload file..." />
</div>`
})
export class OpenFileDialog extends Dialog {
    // instance data

    private title : string = "Open File";
    private result;

    // constructor

    constructor(injector: Injector) {
        super(injector);

        this.addButton({
            label: "Ok",
            isDefault: true, // enter
            shortCut: "enter",
            run: () => {
                return this.result;
            }
        });

        this.addButton({
            label: "Cancel",
            isCancel: true, // esc
            shortCut: "esc",
            run: () => {
                return undefined;
            }
        });
    }

    // callbacks

    fileChangeEvent($event) {
        if ( $event.target.files.length == 1) {
            let file : File = $event.target.files[0];

            let reader = new FileReader();
            reader.onloadend = (e : any) => {
                this.result = JSON.parse(e.target.result);
            };

            reader.readAsText(file);
        } // if
    }
}
// TODO

Injectable()
@Component({
    selector: 'ui-editor',
    host: {
        'style': 'height: 100%'
    },
    template: `<template ngbModalContainer></template>
<div class="ui-editor flex-rows" toast-container="">
   <split-pane class="flex-row flex-stretch">
      <!-- left -->
      
      <split-panel [initialSize]="'20%'">
          <!-- tabs -->
          
          <div  style="height: 100%;">
              <div class="left-container">
                <!-- load -->
              
                <li class="glyphicon glyphicon-upload" [ngClass]="{'active': true}" (click)="load()"></li>
                
                <!-- save -->
                
                <li class="glyphicon glyphicon-floppy-disk" [ngClass]="{'active': isDirty()}" (click)="save()"></li>
                
                <!-- revert -->
                
                <li class="glyphicon glyphicon-remove" [ngClass]="{'active': isDirty()}" (click)="revert()"></li>
              </div>
          
              <tabs (onSelect)="activateTab($event)">
                <!--  tree -->
                
                <tab [name]="'tree'" [icon]="'glyphicon glyphicon-list'">
                     <template let-tab="tab" tabheader>
                        <div class="float-tab" (click)="floatTab(tab)">
                        </div>
                     </template>
                     
                  <div #floatingtree  [floating]="false" [title]="'Tree'" [container]="self" (onFloat)="onFloat($event)" (onDock)="onDock($event)">
                     <template #body>
                        <component-tree [contextmenu]="menu" [root]="root" [model]="treeModel"></component-tree>
                     </template>
                  </div>
                </tab>
         
                <!-- palette -->
                
                <tab [name]="'palette'" [icon]="'glyphicon glyphicon-folder-open'">
                    <template let-tab="tab" tabheader>
                     </template>
                     
                    <palette-editor></palette-editor>
                </tab>
                
                <!-- code -->
                
                <tab [name]="'code'" [icon]="'glyphicon glyphicon-floppy-disk'">
                     <!--template let-tab="tab" tabheader>
                     </template-->
                     
                    <pre class="code">{{code|json}}</pre>
                </tab>
              </tabs>
            </div>
      </split-panel>
      
      <!-- middle -->
      
      <split-panel [stretch]="true" [initialSize]="'60%'">
         <tabs (onSelect)="switchMode($event)">
            <tab [name]="'editor'" [icon]="'glyphicon glyphicon-play'">
                <editor [hidden]="mode == 'run'" [root]="root" [context]="self" [onSelection]="selectionEvent" [history]="changes"></editor>
                <div [hidden]="mode == 'edit'" [render-component]="mode != 'edit'" [component]="root" [context]="self"></div>
            </tab>
         </tabs>
      </split-panel>
     
     <!-- right -->
     
     <split-panel [initialSize]="'20%'">
        <tabs>
           <tab [name]="'settings'" [icon]="'glyphicon glyphicon-cog'">
           <template #tab>
                    props
                 </template>
                 
                <component-editor [model]="currentComponent" (onChange)="onChange($event)"></component-editor>
           </tab>
        </tabs>
     </split-panel>
   </split-pane>
</div>
`
})
export class UIEditorComponent implements OnChanges, FloaterContainer {
    // instance data

    //@Input('root')
    private root : any = {id: "body", children: []};

    private currentComponent : any; // the internal object!
    private treeModel : any;

    @ViewChild(EditorComponent)
    private editor : EditorComponent;
    @ViewChild(RenderComponent)
    private renderComponent : RenderComponent;
    @ViewChild(Tabs)
    private tabs : Tabs;

    private mode : string = "edit";
    private code : any;
    private self = this;

    changes : EditorActionHistory;


    // TEST

    private user : "andi";
    private password : "geheim";
    login() {
        console.log("login");

    }

    floatTab(tab) {
        this.floatTree(tab.bounds());
    }

    private selectionEvent : EventEmitter<any> = new EventEmitter();

    private factory : ComponentFactory<Floater>;

    @ViewChild(Floating)
    private floatingTree : Floating;

    private onFloat(event, tree) {
        this.treeModel.state = this.treeModel.tree.getState();

        this.tabs.setVisible("tree", false);
    }

    private onDock(event, tree) {
        this.treeModel.state = this.treeModel.tree.getState();

        this.tabs.setVisible("tree", true);
        this.tabs.selectTabByName('tree');
    }

    private floatTree(bounds : ClientRect) {
        //this.treeModel.state = this.treeModel.tree.getState(); ?
        this.floatingTree.float({x: bounds.left, y: bounds.top});
    }

    // TODO REMOVE
    onChange(event : any) { // model: attribute: newValue:
    }

    // implement FloaterContainer

    open(title : string, bounds : any, body: TemplateRef <Object>, onDock : EventEmitter<any>) : ComponentRef<Floater>{
        let component = this.viewContainerRef.createComponent(this.factory);

        const floater = component.instance as Floater;

        // link data

        floater.title = title;
        floater.component = component;
        floater.body = body;
        floater.bounds = bounds;
        floater.onDock = onDock;

        return component;
    }

    // constructor

    constructor(private injector: Injector, private toasts : ToastService, private componentRegistry : ComponentRegistry, private editorService : EditorService,  resolver: ComponentFactoryResolver, protected viewContainerRef: ViewContainerRef, private changeDetector: ChangeDetectorRef) {
        this.factory = resolver.resolveComponentFactory(Floater);

        this.changes = new EditorActionHistory(editorService);

        this.setup();
    }

    // callbacks

    activateTab(tab : any) {
        if (tab.name == "code") {
            this.code = this.editorService.copyModel(this.root, true);
            this.editorService.stripModel(this.code);
        }
    }

    switchMode(tab : Tab) {
        if (this.mode == "edit") {
            this.mode = "run";
            tab.icon = 'glyphicon glyphicon-pencil';

            this.renderComponent.render();
        }
        else {
            this.mode = "edit";
            tab.icon = 'glyphicon glyphicon-play';
        }
    }

    // private

    private getIcon(node : any) {
        return this.componentRegistry.find(node.id).icon;
    }

    private reparent(component : any, parent : any) {
        this.changes.pushAction(new ReparentAction(this.changes, "reparent", component, parent));
    }

    private isChildOf(component1 : any, component2) {
        let comp = component1;
        while ( comp ) {
            if (comp === component2)
                return true;

            comp = comp.$parent;
        } // while

        return false;
    }

    buildMenu(builder : MenuBuilder) : void {
        if (this.currentComponent) {
            builder
                .addSubmenu(builder.menu("Children")
                    .addItem("Foo", () => {console.log("FOO!"); }))
                .addDivider()
                .addItem("Delete:⌫", () => {this.editor.selection.onDelete(undefined); });
                //.addDivider();
        }
    }

    menu : Function = this.buildMenu.bind(this);

    // OnChanges

    nodeStyle(model : any) {
       let selected = this.currentComponent == model;

       if (!selected)
           return selected ? {} : {
           display: 'none'
           };
    }

    deleteNode() {
        this.editor.selection.onDelete(undefined);
    }

    private confirm : any;


    saveLocalJSON(data : any, filename = undefined) : void {
        if (!filename)
            filename = 'download.json';

        if (typeof data === 'object')
            data = JSON.stringify(data, undefined, 2);

        let blob = new Blob([data], {type: 'text/json'});

        let mouseEvent = document.createEvent('MouseEvents');

        let a = document.createElement('a');

        a.download = filename;
        a.href = window.URL.createObjectURL(blob);

        mouseEvent.initEvent('click', true, true);

        a.dispatchEvent(mouseEvent);
    };

    openFile() {
        let shortcut = this.injector.get(Shortcut);

        let modal : NgbModalRef = this.injector.get(NgbModal).open(OpenFileDialog, {});

        //modal.componentInstance.buttons = commands;

        return modal.result.then(
            (value) => {
                if (value) {
                    this.revert();
                    this.setRoot(value);

                    return value;
                }
            },
            (reason) => {
                return reason;
            });
    }

    private load() : void {
        this.openFile();
    }

    private save() {
        let data = this.editorService.copyModel(this.root, true);

        this.editorService.stripModel(data);

        this.saveLocalJSON(data);

        this.toasts.info("Saved...", undefined, 2000);

        this.changes.clear();
    }

    private revert() {
        this.currentComponent = undefined; // avoid problems with strange editor states?

        this.changes.revert(); // what about the next change detector which should trigger
    }

    private isDirty() {
        return this.changes.isDirty();
    }

    private setRoot(root : any) : void {
        this.editorService.connectModel(root); // setup parent links and create defaults

        this.root = root;

        if (this.treeModel)
            this.treeModel.root = [root];
    }

    private setup() : void {
        this.confirm = {
            position: 'right',
            ok: "Yes",
            cancel: "No",
            title: "Delete Node",
            message: "Really delete?",
            onOk: () => {
                this.deleteNode();
            },
            onCancel: () => {},
        };

        this.selectionEvent.subscribe((component : any) => {
            this.changes.select(<EditComponent>this.editor.selection);

            this.currentComponent = component;
        });

        this.treeModel = {
            root: [this.root],
            dropAllowed: (node : any, parent : any) => {
                let allow = !this.isChildOf(parent, node); // also works for ==

                if (allow)
                    allow = this.componentRegistry.find(node.id).isValidParent(parent.id); // valid...

                return allow;
            },
            dropped: (node : any, parent : any) => {
                this.reparent(node, parent);
            },
            context: this, // the label template will be able to reference this instance, e.g. createDragObject! + model!
            label: `
            <span [drop-target]="node" [drag-source]="node">
               <span class="icon glyphicon glyphicon-{{getIcon(model)}}" [ngClass]=""></span>
               <span class="label">{{model.id}}</span>
               <span class="glyphicon glyphicon-remove" [confirm]="confirm" [ngStyle]="nodeStyle(model)" style="float: right"></span>
            </span>`,
            onSelect: this.selectionEvent//comp => {this.selectionEvent.emit(comp);} (click)="deleteNode()"
        };

        this.setRoot(this.root);
    }

    // OnChanges

    ngOnChanges(changes: SimpleChanges) {
       console.log("WTF");
    }
}
