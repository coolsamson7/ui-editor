import {
    Directive,
    ComponentRef,
    ViewContainerRef,
    Input,
    Component,
    AfterViewInit,
    ViewChild,
    ElementRef,
    ContentChild,
    TemplateRef,
    EmbeddedViewRef,
    Output,
    EventEmitter
} from "@angular/core";

@Component({
    selector: "floater",
    template: `
<div style="display: flex; flex-direction: column;" #container (mousedown)="onMouseDown($event, 'resize')" (mousemove)="onMouseMove($event)" class="floater">

    <div (click)="close()"  class="close">
        <span class="glyphicon glyphicon-remove"></span>
    </div>


    <div class="title" (mousedown)="onMouseDown($event, 'drag')" >
       {{title}}
    </div>
    <div style="flex-grow: 1; flex-basis: 100%; overflow: scroll">
        <template [ngTemplateOutlet]="body"></template>
    </div>
</div>
`
})
export class Floater implements AfterViewInit {
    // instance data

    @ViewChild("container")
    container : ElementRef;

    onDock : EventEmitter<any>;

    component : ComponentRef<Floater>;
    body : TemplateRef <Object>;

    title : string = "Title";
    drag : string;
    clientX : number;
    clientY : number;

    bounds : any;
    //x : number;
    //y : number;
    //width : number;
    //height : number;

    onDocumentMouseMove = (event : any) => {
        if (this.drag) {
            let deltaX = event.clientX - this.clientX;
            let deltaY = event.clientY - this.clientY;

            if (this.drag == 'drag')
                this.moveBy(deltaX, deltaY);

            else if (this.drag == 'resize-left' || this.drag == 'resize-left-bottom') {
                this.moveBy(deltaX, 0);
                this.resize(this.bounds.width - deltaX, this.bounds.height);
            }

            else if (this.drag == 'resize-right') {
                this.resize(this.bounds.width + deltaX, this.bounds.height);
            }

            else if (this.drag == 'resize-bottom') {
                this.resize(this.bounds.width, this.bounds.height + deltaY);
            }

            else if (this.drag == 'resize-right-bottom') {
                this.resize(this.bounds.width + deltaX, this.bounds.height + deltaY);
            }

            // remember coordinates

            this.clientX = event.clientX;
            this.clientY = event.clientY;
        } // if
    };

    onDocumentMouseUp = (event : any) => {
        this.drag = undefined;

        document.removeEventListener('mousemove', this.onDocumentMouseMove);
        document.removeEventListener('mouseup', this.onDocumentMouseUp);
    };

    // constructor

    constructor(protected element : ElementRef) {
    }

    // events

    onMouseMove(event) {
        let drag = this.dragType(event.clientX, event.clientY);
        let cursor = 'auto';

        switch (drag) {//n-resize
            case 'resize-left':
                cursor = 'w-resize';
                break;
            case 'resize-right':
                cursor = 'e-resize';
                break;
            case 'resize-bottom':
                cursor = 's-resize';
                break;
            case 'resize-right-bottom':
                cursor = 'se-resize';
                break;
            case 'resize-left-bottom':
                cursor = 'sw-resize';
                break;
        }

        this.container.nativeElement.style.cursor = cursor;
    }

    // private

    private resize(w : number, h : number) {
        this.container.nativeElement.style.width = w + "px";
        this.container.nativeElement.style.height = h + "px";

        this.bounds.width = w;
        this.bounds.height = h;
    }

    private moveBy(deltaX : number, deltaY : number) {
        this.move(this.bounds.x + deltaX, this.bounds.y + deltaY);
    }

    private move(x : number, y : number) {
        // remember values

        this.bounds.x = x;
        this.bounds.y = y;

        // and set...

        this.container.nativeElement.style.left = x + "px";
        this.container.nativeElement.style.top = y + "px";
    }

    // event callbacks

    close() {
        let bounds = this.container.nativeElement.getBoundingClientRect();

        this.bounds.x = bounds.left;
        this.bounds.y = bounds.top;
        this.bounds.width = bounds.width;
        this.bounds.height = bounds.height;

        this.onDock.emit(this.component);
    }

    dragType(x, y) : string {
        //let x = event.clientX;
        //let y = event.clientY;

        let drag = 'resize';

        let rect = this.container.nativeElement.getBoundingClientRect();

        // forget about rect.top...

        if (x - rect.left <= 4)
            drag = "resize-left";

        else if (rect.right - x <= 4)
            drag = "resize-right";

        if (rect.bottom - y <= 4)
            if (drag == 'resize')
                drag = "resize-bottom";
            else
                drag += "-bottom"; // resize-left-bottom

        return drag;
    }

    onMouseDown(event, type) {
        event.preventDefault();
        event.stopPropagation();

        this.drag = type;

        this.clientX = event.clientX;
        this.clientY = event.clientY;

        if (type == 'resize')
            this.drag = this.dragType(this.clientX, this.clientY);

        document.addEventListener('mousemove', this.onDocumentMouseMove);
        document.addEventListener('mouseup', this.onDocumentMouseUp);
    }

    // AfterViewInit

    ngAfterViewInit() : void {
        let bounds = this.container.nativeElement.getBoundingClientRect();

        if (!this.bounds.x) {
            this.bounds.x = bounds.left;
            this.bounds.y = bounds.top;
        } // if

        if (!this.bounds.width) {
            this.bounds.width = bounds.width;
            this.bounds.height = bounds.height;
        } // if

        this.move(this.bounds.x, this.bounds.y);
        this.resize(this.bounds.width, this.bounds.height);
    }
}

export interface FloaterContainer {
    open(title : string, bounds : any, body : TemplateRef <Object>, onClose : EventEmitter<any>) : ComponentRef<Floater>;
}

@Directive({
    selector: "[floating]"
})
export class Floating implements AfterViewInit {
    // instance data

    @Input()
    floating : boolean;
    @Input()
    container : FloaterContainer;
    @Input('title')
    private title : string = "Title";

    @Output() onFloat : EventEmitter<any> = new EventEmitter();
    @Output() onDock : EventEmitter<any> = new EventEmitter();

    @ContentChild("body") private body : TemplateRef <Object>;

    protected floater : ComponentRef<Floater>;

    private bounds : any = {};

    private embeddedView : EmbeddedViewRef<Object>;

    // constructor

    constructor(protected viewContainerRef : ViewContainerRef) {
        // subscribe to events

        this.onFloat.subscribe((event) => {
            // destroy embedded view?
            setTimeout(() => {
                if (this.embeddedView) {
                    this.embeddedView.destroy();

                    this.embeddedView = undefined;
                }
            }, 0);
        });

        this.onDock.subscribe((event) => {
            setTimeout(() => {
                // destroy floater

                this.floater.destroy();
                this.floater = undefined;

                // embed view

                this.embedView();
            }, 0);
        })
    }

    // methods

    embedView() {
        this.embeddedView = this.viewContainerRef.createEmbeddedView(this.body);
    }

    float(bounds : any) {
        this.onFloat.emit(undefined);

        if (!this.bounds.x) {
            this.bounds.x = bounds.x;
            this.bounds.y = bounds.y;
        }

        // create floater

        this.floater = this.container.open(this.title ? this.title : "Title", this.bounds, this.body, this.onDock);
    }


    // AfterViewInit

    ngAfterViewInit() : void {
        if (this.floating)
            this.float(this.bounds);

        else
            this.embedView();
    }
}
