import {
    Component,
    Directive,
    Injectable,
    ElementRef,
    ViewChild,
    HostListener,
    AfterViewInit,
    OnInit,
    Input
} from "@angular/core";

// interface

class SizePolicy {
    // instance data

    private stretch : boolean;
    private initial : string ;

    // constructor

    constructor(stretch : boolean, initial : string) {
        this.stretch = stretch;
        this.initial = initial;
    }

    // public

    public stretches() : boolean {
        return this.stretch;
    }

    public isFixedSize() : boolean {
        return !this.initial.endsWith("%");
    }

    public getFixedSize() : number {
        return parseInt(this.initial.substring(0, this.initial.length - 1));
    }

    public getPercentage() : number {
        return parseInt(this.initial.substring(0, this.initial.length - 1)) / 100;
    }
}

interface Splittable {
    index() : number;

    show(show : boolean) : void;

    moveBy(deltaX: number, deltaY: number) : void;

    grow(number: number) : number;

    size(x : number, y : number) : void;

    splitterWidth() : number;

    getNativeElement() : HTMLElement;

    sizePolicy() : SizePolicy;
}

@Component({
    selector: 'split-pane',
    template: '<div class="split-pane"><ng-content></ng-content></div>'
})
@Injectable()
export class SplitPane implements OnInit {
    // instance data

    private splittables : Splittable[] = [];
    private nativeElement : HTMLElement;
    private width : number = -1;

    // constructor

    constructor(private elementRef : ElementRef) {
    }

    // host listeners

    @HostListener('window:resize')
    onResize() {
        this.maybeLayout();
    }

    maybeLayout() {
        if (this.width >= 0) { // is set in ngAfterViewInit
            let w = this.getWidth();
            if (w !== this.width) {
                this.layout(w);

                // remember

                this.width = w;
            } // if
        }
    }

    // lifecycle

    ngOnInit() : void {
        this.removeHostElement(this.elementRef);
    }

    ngAfterViewInit() : void {
        this.width = 0;

        this.maybeLayout();
    }

    // internal


    private layout(nativeWidth : number) {
        let splitterWidth = this.splittables.length > 1 ? this.splittables[0].splitterWidth(): 0;
        let distributeWidth = nativeWidth - (this.splittables.length - 1) * splitterWidth;

        if (this.width == 0) {
            // initial layout

            // set fixed widths

            for (let splittable of this.splittables.filter((splitter) => splitter.sizePolicy().isFixedSize())) {
                let size = splittable.sizePolicy().getFixedSize();

                splittable.size(size, this.nativeElement.getBoundingClientRect().height);

                distributeWidth -= size;
            } // for

            // distribute the rest

            for (let splittable of this.splittables.filter((splitter) => !splitter.sizePolicy().isFixedSize())) {
                let percentage = splittable.sizePolicy().getPercentage();

                splittable.size(percentage * distributeWidth, this.nativeElement.getBoundingClientRect().height);
            } // for
        }
        else {
            // subsequent layout, only stretchable elements will grow

            let stretchables = this.splittables.filter((splitter) => splitter.sizePolicy().stretches()).length;

            let deltaWidth = nativeWidth - this.width; // > or < 0!

            for (let splittable of this.splittables.filter((splitter) => splitter.sizePolicy().stretches())) {
                splittable.grow(deltaWidth / stretchables);
            } // for

            this.fix();
        }

    }

    fix() {
        let total = this.getWidth();
        let width = 0;

        let len = this.splittables.length;
        let lastNonEmpty : Splittable = undefined;
        for (let i = 0; i < this.splittables.length; i++) {
            let splittable = this.splittables[i];
            let splitterWidth = splittable.getNativeElement().getBoundingClientRect().width;
            width +=  splitterWidth + ((i < len - 1) ? splittable.splitterWidth() : 0);

            if (!lastNonEmpty && splittable.getNativeElement().getBoundingClientRect().width > 0)
                lastNonEmpty = splittable;
        } // for

        if (width > total && lastNonEmpty) {
            console.log("FIX " + (total - width));
            lastNonEmpty.grow(total - width);
        }
    }

    getWidth() : number {
        return this.nativeElement.getBoundingClientRect().width;
    }

    removeHostElement(elementRef : ElementRef) {
        let nativeElement: HTMLElement = elementRef.nativeElement;
        let parentElement: HTMLElement = nativeElement.parentElement;

        this.nativeElement = <HTMLElement>nativeElement.firstChild;

        // move all children out of the element

        while (nativeElement.firstChild)
            parentElement.insertBefore(nativeElement.firstChild, nativeElement);

        // remove the empty element(the host)

        parentElement.removeChild(nativeElement);
    }

    add(splittable : Splittable) : number{
        if (this.splittables.length > 0)
            this.splittables[this.splittables.length-1].show(true);

        this.splittables.push(splittable);

        return this.splittables.length - 1;
    }

    before(splittable: Splittable) : Splittable {
        return this.splittables[splittable.index() - 1];
    }

    after(splittable: Splittable) : Splittable {
        return this.splittables[splittable.index() + 1];
    }

    splittable(index : number) : Splittable {
        return this.splittables[index];
    }

    movePanelBy(splittable: Splittable, deltaX: number, deltaY: number) {
        let index = this.splittables.indexOf(splittable);

        if (deltaX > 0){
            // shrink splittable after
            deltaX = this.after(splittable).grow(-deltaX);
            // grow own
            splittable.grow(-deltaX);
        }
        else {
            // shrink
            deltaX =  splittable.grow(deltaX);
            this.after(splittable).grow(-deltaX);
        }

        this.fix();
    }
}

@Directive({
    selector: '[splitter]',
    host: {
        'style': 'height: 100%'
    },
})
export class Splitter {
    // instance data

    private drag = false;
    private clientX : number = 0;
    private clientY : number = 0;
    splittable : Splittable;

    // constructor

    constructor(public elementRef : ElementRef) {
    }

    // public

    public width() : number {
        return this.elementRef.nativeElement.getBoundingClientRect().width;
    }

    // private

    // event listener

    @HostListener('mousedown', ['$event'])
    mouseDown(event) {
        event.preventDefault();

        this.drag = true;

        this.clientX = event.clientX;
        this.clientY = event.clientY;
    }

    @HostListener('document:mousemove', ['$event'])
    mouseMove(event) {
        if (this.drag) {
            let deltaX = event.clientX - this.clientX;
            let deltaY = event.clientY - this.clientY;

            if (deltaX != 0 /*&& deltaY != 0*/)
                this.splittable.moveBy(deltaX, deltaY);

            this.clientX = event.clientX;
            this.clientY = event.clientY;
        } // if
    }

    @HostListener('document:mouseup', ['$event'])
    mouseUp(event) {
        this.drag = false;
    }
}

@Component({
    selector: 'split-panel',
    host: {
        'style': 'height: 100%'
    },
    template: '<div class="split-panel"><ng-content></ng-content></div><div class="splitter" splitter *ngIf="showSplitter"></div>'
})
@Injectable()
export class SplitPanel implements Splittable, OnInit, AfterViewInit {
    // instance data

    showSplitter : boolean;

    @ViewChild(Splitter)
    splitter : Splitter;

    private nativeElement: HTMLElement;
    private _index : number;

    @Input()
    private stretch : boolean = false;
    @Input()
    private initialSize : string = "100%";

    // constructor

    constructor(private pane : SplitPane, private elementRef : ElementRef) {
        this._index = pane.add(this);
    }

    // private

    removeHostElement(elementRef : ElementRef) {
        let nativeElement: HTMLElement = this.elementRef.nativeElement;
        let parentElement: HTMLElement = nativeElement.parentElement;

        this.nativeElement = <HTMLElement>nativeElement.firstChild;

        // move all children out of the element

        while (nativeElement.firstChild)
            parentElement.insertBefore(nativeElement.firstChild, nativeElement);

        // remove the empty element(the host)

        parentElement.removeChild(nativeElement);
    }

    // OnInit

    ngOnInit() : void {
        this.removeHostElement(this.elementRef);
    }


    // AfterViewInit

    ngAfterViewInit() : void {
        if (this.splitter)
            this.splitter.splittable = this;
    }

    // implement Splittable

    moveBy(deltaX: number, deltaY: number) : void{
        this.pane.movePanelBy(this, deltaX, deltaY);
    }

    grow(number: number): number {
        let width = Math.round(this.nativeElement.getBoundingClientRect().width);
        let newWidth = width + number;

        if (newWidth < 0) {
            number -= newWidth; number = Math.round(number);
            newWidth = 0;
        }

        this.nativeElement.style.width = newWidth.toString() + "px";

        return number;
    }

    size(x : number, y : number) : void {
        this.nativeElement.style.width  = x.toString() + "px";
        //this.nativeElement.style.height = y.toString() + "px";

        //if (this.splitter)
        //    this.splitter.elementRef.nativeElement.style.height = y.toString() + "px";
    }

    index() : number {
        return this._index;
    }

    show(show : boolean) : void {
        this.showSplitter = show;
    }

    splitterWidth() : number {
        return this.splitter ? this.splitter.width(): 0;
    }

    getNativeElement() : HTMLElement {
        return this.nativeElement;
    }

    sizePolicy() : SizePolicy {
        return new SizePolicy(this.stretch, this.initialSize);
    }
}

