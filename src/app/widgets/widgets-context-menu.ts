import {
    Directive,
    HostListener,
    ComponentRef,
    ViewContainerRef,
    ComponentFactoryResolver,
    Input,
    Component,
    OnDestroy,
    ViewChild,
    ElementRef, OnInit, AfterViewInit
} from "@angular/core";
import {Overlay, Overlays} from "./widgets-overlays";


export class MenuBuilder {
    // instance data

    private label : string;
    private _menu : any[];

    // constructor

    constructor(menu : any[], label : string) {
        this._menu = menu;
        this.label = label;
    }

    // fluent

    public menu(label : string) : MenuBuilder {
        return new MenuBuilder([], label);
    }

    public addSubmenu(menu : MenuBuilder) : MenuBuilder {
        this._menu.push({
            label: menu.label,
            children: menu._menu
        });

        return this;
    }

    public addAction(action : any) : MenuBuilder {
        this._menu.push(action);

        return this;
    }

    public addItem(label : string, action : () => void) : MenuBuilder {
        let shortcut = undefined;
        if (label.includes(':')) {
            let index = label.indexOf(':');
            shortcut = label.substr(index + 1);
            label = label.substring(0, index);
        }

        this._menu.push({
            label: label,
            shortcut: shortcut,
            action: action
        });

        return this;
    }

    public addDivider() : MenuBuilder {
        this._menu.push({divider: true});

        return this;
    }
}

class MenuElement {
    // instance data

    parent : MenuElement;
    child : MenuElement;
    component : ComponentRef<MenuContent>;
    items : any[];

    // constructor

    constructor() {
    }

    // abstract

    createMenu(parent : MenuElement, items : any[]) : MenuElement {
        return undefined;
    }

    move(x : number, y : number) {
    }

    contains(target) : boolean {
        return false;
    }

    // methods

    root() : MenuElement {
        let result : MenuElement = this;
        while (result.parent)
            result = result.parent;

        return result;
    }

    delete() {
        // recursion

        if (this.child)
            this.child.delete();

        if (this.component)
            this.component.destroy();

        // unlink from parent

        if (this.parent)
            this.parent.onDeleteChild(this);
    }

    onDeleteChild(child : MenuElement) {
        this.child = undefined;
    }
}

@Component({// <canvas #canvas height="{{width}}" width="{{height}}" [ngStyle]="style()"></canvas>
    selector: "triangle",
    template: `
    <svg #svg xmlns="http://www.w3.org/2000/svg" version="1.1" [ngStyle]="style()">
        <polygon #polygon points="" [ngStyle]="polygonStyle()"/>
    </svg>
`
})
export class TriangleComponent implements OnInit  {
    // input data

    @Input() width : number;
    @Input() height : number;

    @ViewChild("polygon")
    private polygon: ElementRef;
    @ViewChild("svg")
    private svg: ElementRef;

    // private


    private style() {
        return {
            margin: '0 auto',
            width: '' + this.width + "px",
            height: '' + this.height + "px",
        };
    }

    private polygonStyle() {
        return {
            fill: 'white'
            //stroke: 'red',
            //'strike-width': '2'
        };
    }

    private newPoint(x : number, y : number) {
        let point = this.svg.nativeElement.createSVGPoint();

        point.x = x;
        point.y = y;

        return point;
    }

    private addPoint(x : number, y : number) : TriangleComponent {
        this.polygon.nativeElement.points.appendItem(this.newPoint(x, y));

        return this;
    }

    // OnInit

    ngOnInit(): void {
        this
            .addPoint(0, 0)
            .addPoint(this.width, this.height / 2)
            .addPoint(0, this.height);
    }
}

@Component({
    selector: "menu-content",
    template: `
<div #container class="dropdown" [ngStyle]="styles()">
    <ul id="contextMenu" style="display: block;" class="dropdown-menu" role="menu" >
      <li *ngFor="let item of items"  (click)="onClick(item)" [ngClass]="{'active': item == active, 'divider': item.divider, 'item': !item.divider}" style="display: flex; align-items: center">
        <span *ngIf="item.label" role="menuitem" (mouseenter)="onMouseEnter($event, item)" (mouseleave)="onMouseExit($event, item)" style="flex-grow: 1">{{item.label}}</span>
        <span *ngIf="item.shortcut">{{item.shortcut}}</span>
        <triangle *ngIf="item.children" [width]="9" [height]="9"></triangle>
      </li>
    </ul>
</div>
`
})
export class MenuContent extends MenuElement {
    // instance data

    @ViewChild("container")
    private container: ElementRef;

    private menuItem : any;

    private active : any;

    // constructor

    constructor(protected element: ElementRef) {
        super();
    }

    // private

    private findPos(element) : any {
        let left = 0;
        let top = 0;

        if (element.offsetParent) {
            do {
                left += element.offsetLeft;
                top += element.offsetTop;
            } while (element = element.offsetParent);
        }

        return {
            left : left,
            top : top
        };
    }

    // event handler

    onMouseExit(event : MouseEvent, item : any) {
        if (!this.child)
            this.active = undefined;
    }

    onMouseEnter(event : MouseEvent, item : any) {
        this.active = item;

        // delete existing items

        if (this.menuItem && this.menuItem !== item) {
            this.child.delete();

            this.menuItem = undefined;
        }

        // create new

        if (item.children && !this.child) {
            let position = this.findPos(event.target);

            this.menuItem = item;

            this.root().createMenu(this, item.children).move(position.left + (event.target as any).offsetWidth, position.top);
        } // if
    }

    onClick(item) {
        if (item.action)
            item.action(); // divider has no action...

        this.delete();
    }

    // methods

    styles() {
        return {
            position: 'fixed',
            'z-index': '99999',
            display:  'block'
        };
    }

    // override

    contains(target) : boolean {
        return this.element.nativeElement.contains(event.target);
    }

    move(x : number, y : number) {
        this.container.nativeElement.style.left = x + "px";
        this.container.nativeElement.style.top  = y + "px";
    }
}

@Directive({
    selector: "[contextmenu]"
})
export class ContextMenu extends MenuElement implements OnDestroy {
    // inputs

    @Input("contextmenu")
    private contextmenu : Function;// () => any[];

    // catch clicks outside of the hosting element

    onDocumentMouseDown = (event: any) => {
        if (this.child)
            if (!this.child.contains(event.target))
                this.child.delete();
    };

    // constructor

    constructor(protected viewContainerRef: ViewContainerRef, protected resolver: ComponentFactoryResolver) {
        super();
    }

    // event listeners

    @HostListener("click", ['$event'])
    onClick(event) : void {
        if (this.child)
            this.child.delete(); // no preventDefault!
    }

    @HostListener("contextmenu", ['$event'])
    onContextMenu(event) : void {
        event.preventDefault();

        let x = event.pageX;
        let y = event.pageY;

        if (!this.child) {
            this.items = [];
            let builder = new MenuBuilder(this.items, '');

            this.contextmenu(builder);

            if (this.items.length > 0) {
                event.preventDefault();

                (this.child = this.createMenu(this, this.items)).move(x, y);

                document.addEventListener("mousedown", this.onDocumentMouseDown);
            } // if
        } // if
        else this.child.move(x, y);
    }

    // override

    onDeleteChild(child : MenuElement) {
        super.onDeleteChild(child);

        document.removeEventListener("mousedown", this.onDocumentMouseDown);
    }

    createMenu(parent : MenuElement, items : any[]) : MenuElement {
        const factory = this.resolver.resolveComponentFactory(MenuContent);

        let component : ComponentRef<MenuContent> = this.viewContainerRef.createComponent(factory);

        const menuContent = component.instance as MenuContent;

        // link

        parent.child = menuContent;
        menuContent.parent    = parent;

        // set data

        menuContent.items     = items;
        menuContent.component = component;

        return menuContent;
    }

    // OnDestroy

    ngOnDestroy() {
        if (this.child)
            this.child.delete();
    }
}

// TEST
@Component({
    selector: "confirm-window",
    template: `
   <!-- default -->
   
   <template #defaultTemplate let-options="options">
       <p [innerHTML]="options.message"></p>
          <div class="row">
            <div class="col-xs-6">
              <button
                [class]="'btn'"
                (click)="options.onOk()"
                [innerHtml]="options.okText">
              </button>
            </div>
            <div class="col-xs-6">
              <button
                [class]="'btn'"
                (click)="options.onCancel()"
                [innerHtml]="options.cancelText">
              </button>
            </div>
          </div>
    </template>
    
<div #container class="popover" [ngClass]="options.position" [ngStyle]="style()"  [style.top]="y + 'px'"
     [style.left]="x + 'px'">
   <div class="arrow"></div>
        
   <h3 class="popover-title" [innerHTML]="options.title"></h3>
        
   <div class="popover-content">
     <template
      [ngTemplateOutlet]="options.template || defaultTemplate"
      [ngOutletContext]="{options: options}">
    </template>
   </div>
        

</div>
`
})
export class ConfirmWindow extends Overlay implements AfterViewInit {
    @ViewChild("container")
    private container: ElementRef;

    options : any = {};

    private x : number;
    private y : number;

    // constructor

    constructor(public element: ElementRef) {
        super();
    }

    // private

    style() {
        return {
            'z-index': 99999,
            position: 'fixed',
            color: 'black',
            display:  'block'
        };
    }

    contains(target) : boolean {
        return this.element.nativeElement.contains(target);
    }

    move(x : number, y : number) {
        this.x = x;
        this.y = y;
    }

    // AfterViewInit

    ngAfterViewInit(): void {
      setTimeout(() => {
        let position = this.calcPosition(this.element.nativeElement.children[0]);

        this.move(position.left, position.top);
      }, 0);
    }
}

@Directive({
    selector: "[confirm]"
})
export class Confirm implements OnDestroy {
    // instance data

    private window : ComponentRef<ConfirmWindow>;
    @Input("confirm")
    private options;

    // catch clicks outside of the hosting element

    onDocumentMouseDown = (event: any) => {
        if (this.window)
            if (!this.window.instance.contains(event.target))
                this.hide();
    };

    // constructor

    constructor(protected viewContainerRef: ViewContainerRef, private overlays : Overlays) {
    }

    // private

    private show() {
        (this.window = this.create());

        document.addEventListener("mousedown", this.onDocumentMouseDown);
    }

    private hide() {
        if (this.window) {
            this.window.destroy();

            document.removeEventListener("mousedown", this.onDocumentMouseDown);

            this.window = undefined;
        }
    }

    private create() : ComponentRef<ConfirmWindow> {
        return this.overlays.createOverlay(this.viewContainerRef.element.nativeElement, "right", ConfirmWindow, {options: {
            position: this.options.position ? this.options.position : "bottom",
            title: this.options.title ? this.options.title : "Title",
            message: this.options.message ? this.options.message : "Message",
            okText: this.options.ok ? this.options.ok : "Ok",
            cancelText: this.options.cancel ? this.options.cancel : "Cancel",
            onOk: () => {
                if (this.options.onOk)
                    this.options.onOk();

                this.hide();
            },
            onCancel: () => {
                if (this.options.onCancel)
                    this.options.onCancel();

                this.hide();
            }
        }
        });
    }

    // event listener

    @HostListener('click', ['$event'])
    toggle(event): void {
        if (this.window)
            this.hide();
        else
            this.show();
    }

    // OnDestroy

    ngOnDestroy() {
        this.hide();
    }
}
