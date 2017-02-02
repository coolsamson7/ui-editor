import {Directive, Input, ElementRef, AfterContentChecked} from "@angular/core";

@Directive({
    selector: '[focus]'
})
export class FocusDirective implements AfterContentChecked {
    // input

    @Input() focus: boolean;

    // instance data

    private element: HTMLElement;

    // constructor

    constructor (element : ElementRef) {
        this.element = element.nativeElement;
    }

    // private

    private giveFocus () {
        if (this.focus)
            this.element.focus();
    }

    // implement AfterContentChecked

    ngAfterContentChecked () {
        this.giveFocus();
    }
}