import {EventEmitter, Directive, Injectable, ElementRef, OnChanges, SimpleChanges, Input, Output} from "@angular/core";
import {DragSource, DropTarget} from "./ui-dd.class";

@Directive({
    selector: '[drag-source]',
    host: {
        '(dragstart)': 'onDragStart($event)',
        '(dragend)': 'onDragEnd($event)',
    }
})
@Injectable()
export class DragSourceComponent implements OnChanges {
    // static data

    static dragData : any;


    // instance data

    @Input()
    private draggable : boolean = true;
    @Input('source')
    private source : () => any;

    @Input('drag-source')
    private dragSource : DragSource;

    // constructor

    constructor(private element: ElementRef) {
    }

    // private

    // handlers

    onDragStart(event) {
        DragSourceComponent.dragData = this.dragSource ? this.dragSource.create() : this.source();

        this.element.nativeElement.classList.add('dragging');

        event.dataTransfer.setData('Text', event.target.id);

        event.dataTransfer.effectAllowed = 'move';
    }

    onDragEnd(event) {
        //DragSourceComponent.dragData = undefined;

        event.preventDefault();
        this.element.nativeElement.classList.remove('dragging');
    }

    // implement

    // OnChanges

    ngOnChanges(changes: SimpleChanges) {
        this.element.nativeElement.setAttribute('draggable', this.draggable ? 'true' : 'false');
    }

}

@Directive({
    selector: '[drop-target]',
    host: {
        '(dragenter)': 'onDragEnter($event)',
        '(dragover)':  'onDragOver($event)',
        '(dragleave)': 'onDragLeave($event)',
        '(drop)':      'onDrop($event)'
    }
})
@Injectable()
export class DropTargetComponent {
    // instance data

    @Output() dropped: EventEmitter<any> = new EventEmitter();

    //@Input
    dropEnabled : boolean = true;

    @Input("dropEnabled") set droppable(value:boolean) {
        this.dropEnabled = !!value;
    }
    @Input("allowDrop")
    allowDrop : (object : any) => boolean;

    @Input("drop-target")
    dropTarget : DropTarget;

    private screenX : number;
    private screenY : number;

    private validAnchors = "center top top-right right bottom-right bottom bottom-left left top-left".split(" ");


    // constructor

    constructor(private element: ElementRef) {
    }

    // private

    private position(e) : string {
        let el = this.element.nativeElement;
        let width = el.offsetWidth; let w3 = width / 3;
        let height = el.offsetHeight; let h3 = height / 3;

        let x = e.offsetX;
        let y = e.offsetY;

        if (x <= w3) { // left
            if (y <= h3) {
                return "top-left";
            }
            else if (y >= 2 * h3) { // bottom
                return "bottom-left";
            }
            else { // center y
                return "left";
            }
        }
        else if (x >= 2 * w3) { // right
            if (y <= h3) {
                return "top-right";
            }
            else if (y >= 2 * h3) { // bottom
                return "bottom-right";
            }
            else { // center y
                return "right";
            }
        }
        else { // center
            if (y <= h3) {
                return "top";
            }
            else if (y >= 2 * h3) { // bottom
                return "bottom";
            }
            else { // center y
                return "center";
            }
        }

        //console.log('x: ' + x + " of " + width + ", y: " + y + " of " + height);
    }

    private dragData(clear : boolean = false) : any {
        let data =  DragSourceComponent.dragData;

        if (clear)
            DragSourceComponent.dragData = undefined;

        return data;
    }

    private dropAllowed() : boolean {
        let allowed = false;

        if (this.dropEnabled) {
            if (this.dropTarget)
                allowed = this.dropTarget.dropAllowed(this.dragData());
            else if (this.allowDrop)
                allowed = this.allowDrop(this.dragData());
        }

        return allowed;
    }

    // handlers

    onDragEnter(event) { //console.log(this.element.nativeElement); console.log("## onDragEnter");
        this.screenX = 0;
        this.screenY = 0;

        if (event.stopPropagation)
            event.stopPropagation();

        if (this.dropAllowed()) {
            event.preventDefault();
            event.stopPropagation();

            this.element.nativeElement.classList.add('over');

            event.dataTransfer.dropEffect = 'move';

            return true;
        }
        else {
            event.dataTransfer.dropEffect = "none";

            return false;
        }
    }

    onDragOver(event) {
        if (this.screenX !== event.screenX || this.screenY !== event.screenY ) {
            if (this.dropAllowed()) {
                event.preventDefault();
                event.stopPropagation();

                //console.log(this.position(event));

                event.dataTransfer.dropEffect = 'move';
            }
        else
            event.dataTransfer.dropEffect = "none";

            // remember

            this.screenX = event.screenX;
            this.screenY = event.screenY;
        }

        return false;
    }

    onDragLeave(event) { //console.log(this.element.nativeElement); console.log("## onDragLeave");
        event.preventDefault();
        event.stopPropagation();

        this.element.nativeElement.classList.remove('over');
    }

    onDrop(event) {
        event.preventDefault();
        event.stopPropagation(); // Stops some browsers from redirecting.

        if (this.dropAllowed()) {
            this.element.nativeElement.classList.remove('over');

            if (this.dropTarget)
                this.dropTarget.dropped(this.dragData());
            else
                this.dropped.emit(this.dragData(true));
        } // if

        return false;
    }
}