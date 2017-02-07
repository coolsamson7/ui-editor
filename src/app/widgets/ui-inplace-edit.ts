import {
    Component,
    ViewChild,
    ElementRef,
    forwardRef,
    AfterViewInit,
    Directive,
    OnInit,
    HostListener,
    OnDestroy,
    Input,
    OnChanges,
    SimpleChanges
} from "@angular/core";
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from "@angular/forms";

@Directive({
    selector: 'input[elastic-input]'
})
export class ElasticInputDirective implements OnInit, OnDestroy, OnChanges {
    // instance data

    @Input('elastic-input')
    private editing : boolean = false;
    private wrapper : HTMLElement;
    private mirror : HTMLElement;

    private lastValue = undefined;

    // constructor

    constructor(private element : ElementRef) {
    }

    // event listener

    @HostListener('input', ['$event.target'])
    onInput() : void {
        this.update();
    }

    // private

    private setMirrorStyle(mirror : HTMLElement, element : HTMLElement) {
        let style = window.getComputedStyle(element);

        ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
            'letterSpacing', 'textTransform', 'wordSpacing'].forEach(
            (value) => {
                mirror.style[value] = style[value];
            });

        mirror.style.paddingLeft = style.textIndent;

        if (style.boxSizing === 'border-box') {
            ['paddingLeft', 'paddingRight', 'borderLeftStyle', 'borderLeftWidth',
                'borderRightStyle', 'borderRightWidth'].forEach((value) => {
                mirror.style[value] = style[value];
            });
        }
        else if (style.boxSizing === 'padding-box') {
            ['paddingLeft', 'paddingRight'].forEach((value) => {
                mirror.style[value] = style[value];
            });
        }
    }

    private update() {
        if (this.editing) {
            let value = this.element.nativeElement.value;

            if (value !== this.lastValue) {
                this.mirror.innerText = value; //console.log(value  + ".width: " + this.mirror.offsetWidth);

                let delta = 1;
                this.element.nativeElement.style.width = `${this.mirror.offsetWidth + delta}px`;

                // done

                this.lastValue = value;
            } // if
        }
    }

    // OnInit

    ngOnInit() : void {
        // create wrapper

        this.wrapper = document.createElement('div');
        this.wrapper.style.position = 'fixed';
        this.wrapper.style.top = '-999px';
        this.wrapper.style.left = '0';

        document.body.appendChild(this.wrapper);

        // crete mirror that is used to calculate the dimensions

        this.mirror = document.createElement('span');
        this.mirror.style.whiteSpace = 'pre';

        this.wrapper.appendChild(this.mirror);

        this.setMirrorStyle(this.mirror, this.element.nativeElement);

        // let's go...

        this.update();
    }

    // OnChanges

    ngOnChanges(changes : SimpleChanges) : void {
        if (this.mirror)
            this.setMirrorStyle(this.mirror, this.element.nativeElement);

        this.update();
    }

    // OnDestroy

    ngOnDestroy() : void {
        this.mirror.remove();
        this.wrapper.remove();
    }
}

class AbstractEditable implements ControlValueAccessor {
    // instance data

    private editing : boolean = false;

    private onChange : any = Function.prototype;
    private onTouched : any = Function.prototype;

    private _value : string = '';

    // constructor

    constructor() {
    }

    // methods

    get value() : any {
        return this._value;
    }

    set value(v : any) {
        if (v !== this._value) {
            this._value = v;

            //this.onChange(v);
        }
    }

    setStyle() {
        // noop
    }

    focus() {
        // noop
    }

    copyStyle(from : any, to : any) {
        let style = window.getComputedStyle(from);

        ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
            'letterSpacing', 'textTransform', 'wordSpacing'].forEach(
            (value) => {
                to.style[value] = style[value];
            });

        to.style.paddingLeft = style.textIndent;

        if (style.boxSizing === 'border-box') {
            ['paddingLeft', 'paddingRight', 'borderLeftStyle', 'borderLeftWidth',
                'borderRightStyle', 'borderRightWidth'].forEach((value) => {
                to.style[value] = style[value];
            });
        }
        else if (style.boxSizing === 'padding-box') {
            ['paddingLeft', 'paddingRight'].forEach((value) => {
                to.style[value] = style[value];
            });
        }

        //to.style.backgroundColor = style.backgroundColor;
        //this.background = style.backgroundColor;

        to.style['outline'] = 'none';
        to.style['border'] = 'none';
    }

    // callbacks

    close() {
        this.editing = false;

        this.onChange(this._value); // delay value propagation!
    }

    edit() {
        this.editing = true;

        // set focus

        this.focus();
    }

    // implement AfterViewInit

    ngAfterViewInit() : void {
        this.setStyle();
    }

    // implement ControlValueAccessor

    /**
     * Write a new value to the element.
     */
    writeValue(value : any) : void {
        this.value = value;
    }

    /**
     * Set the function to be called when the control receives a change event.
     */
    registerOnChange(onChange : any) : void {
        this.onChange = onChange;
    }

    /**
     * Set the function to be called when the control receives a touch event.
     */
    registerOnTouched(onTouched : any) : void {
        this.onTouched = onTouched;
    }

    /**
     * This function is called when the control status changes to or from "DISABLED".
     * Depending on the value, it will enable or disable the appropriate DOM element.
     *
     * @param isDisabled
     */
    setDisabledState?(isDisabled : boolean) : void {
        // TODO?
    }
}

@Component({
    selector: "editable-label",
    template: `
<label #label [hidden]="editing" (dblclick)="edit()" [innerHtml]="value"></label>
<input #input [elastic-input]="editing" [hidden]="!editing" [(ngModel)]="value" (blur)="close()">`,
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => EditableLabel),
        multi: true
    }]
})
export class EditableLabel extends AbstractEditable implements AfterViewInit {
    // instance data

    @ViewChild("input")
    private input : ElementRef;
    @ViewChild("label")
    private label : ElementRef;

    // constructor

    constructor() {
        super();
    }

    // override

    focus() {
        setTimeout(_ => {
            this.input.nativeElement.focus();
        });
    }

    setStyle() {
        this.copyStyle(this.label.nativeElement, this.input.nativeElement);
    }
}

@Component({
    selector: "editable-h1",
    host: {
        'style': 'display: inline-block; position: relative'
    },
    template: `
<h1 #label  (dblclick)="edit()" [innerHtml]="value" style="z-index: 1;" [hidden]="editing" ></h1>
<input #input style="z-index: 2;" [elastic-input]="editing" [hidden]="!editing" [(ngModel)]="value" (blur)="close()">`,
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => EditableH1),
        multi: true
    }]
})
export class EditableH1 extends AbstractEditable implements AfterViewInit {
    // instance data

    @ViewChild("input")
    private input : ElementRef;
    @ViewChild("label")
    private label : ElementRef;

    // constructor

    constructor(private element : ElementRef) {
        super();
    }

    // override

    edit() {
        let nativeInput = this.input.nativeElement;
        let nativeLabel = this.label.nativeElement;

        let style = window.getComputedStyle(nativeLabel);


        nativeInput.style['backgroundColor'] = style['backgroundColor'];

        nativeInput.style['paddingTop'] = style['paddingTop'];
        nativeInput.style['marginTop'] = style['marginTop'];

        nativeInput.style['paddingBottom'] = '0px';

        super.edit();
    }

    focus() {
        setTimeout(_ => {
            this.input.nativeElement.focus();
        });
    }

    setStyle() {
        this.copyStyle(this.label.nativeElement, this.input.nativeElement);
    }
}

@Component({
    selector: "editable-h2",
    host: {
        'style': 'display: inline-block; position: relative'
    },
    template: `
<h2 #label  (dblclick)="edit()" [innerHtml]="value" style="z-index: 1;" [hidden]="editing" ></h2>
<input #input style="z-index: 2;" [elastic-input]="editing" [hidden]="!editing" [(ngModel)]="value" (blur)="close()">`,
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => EditableH2),
        multi: true
    }]
})
export class EditableH2 extends AbstractEditable implements AfterViewInit {
    // instance data

    @ViewChild("input")
    private input : ElementRef;
    @ViewChild("label")
    private label : ElementRef;

    // constructor

    constructor(private element : ElementRef) {
        super();
    }

    // override

    edit() {
        let nativeInput = this.input.nativeElement;
        let nativeLabel = this.label.nativeElement;

        let style = window.getComputedStyle(nativeLabel);


        nativeInput.style['backgroundColor'] = style['backgroundColor'];

        nativeInput.style['paddingTop'] = style['paddingTop'];
        nativeInput.style['marginTop'] = style['marginTop'];

        nativeInput.style['paddingBottom'] = '0px';

        super.edit();
    }

    focus() {
        setTimeout(_ => {
            this.input.nativeElement.focus();
        });
    }

    setStyle() {
        this.copyStyle(this.label.nativeElement, this.input.nativeElement);
    }
}

@Component({
    selector: "editable-h3",
    host: {
        'style': 'display: inline-block; position: relative'
    },
    template: `
<h3 #label  (dblclick)="edit()" [innerHtml]="value" style="z-index: 1;" [hidden]="editing" ></h3>
<input #input style="z-index: 2;" [elastic-input]="editing" [hidden]="!editing" [(ngModel)]="value" (blur)="close()">`,
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => EditableH3),
        multi: true
    }]
})
export class EditableH3 extends AbstractEditable implements AfterViewInit {
    // instance data

    @ViewChild("input")
    private input : ElementRef;
    @ViewChild("label")
    private label : ElementRef;

    // constructor

    constructor(private element : ElementRef) {
        super();
    }

    // override

    edit() {
        let nativeInput = this.input.nativeElement;
        let nativeLabel = this.label.nativeElement;

        let style = window.getComputedStyle(nativeLabel);


        nativeInput.style['backgroundColor'] = style['backgroundColor'];

        nativeInput.style['paddingTop'] = style['paddingTop'];
        nativeInput.style['marginTop'] = style['marginTop'];

        nativeInput.style['paddingBottom'] = '0px';

        super.edit();
    }

    focus() {
        setTimeout(_ => {
            this.input.nativeElement.focus();
        });
    }

    setStyle() {
        this.copyStyle(this.label.nativeElement, this.input.nativeElement);
    }
}

@Component({
    selector: "editable-h4",
    host: {
        'style': 'display: inline-block; position: relative'
    },
    template: `
<h4 #label  (dblclick)="edit()" [innerHtml]="value" style="z-index: 1;" [hidden]="editing" ></h4>
<input #input style="z-index: 2;" [elastic-input]="editing" [hidden]="!editing" [(ngModel)]="value" (blur)="close()">`,
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => EditableH4),
        multi: true
    }]
})
export class EditableH4 extends AbstractEditable implements AfterViewInit {
    // instance data

    @ViewChild("input")
    private input : ElementRef;
    @ViewChild("label")
    private label : ElementRef;

    // constructor

    constructor(private element : ElementRef) {
        super();
    }

    // override

    edit() {
        let nativeInput = this.input.nativeElement;
        let nativeLabel = this.label.nativeElement;

        let style = window.getComputedStyle(nativeLabel);


        nativeInput.style['backgroundColor'] = style['backgroundColor'];

        nativeInput.style['paddingTop'] = style['paddingTop'];
        nativeInput.style['marginTop'] = style['marginTop'];

        nativeInput.style['paddingBottom'] = '0px';

        super.edit();
    }

    focus() {
        setTimeout(_ => {
            this.input.nativeElement.focus();
        });
    }

    setStyle() {
        this.copyStyle(this.label.nativeElement, this.input.nativeElement);
    }
}

@Component({
    selector: "editable-h5",
    host: {
        'style': 'display: inline-block; position: relative'
    },
    template: `
<h5 #label  (dblclick)="edit()" [innerHtml]="value" style="z-index: 1;" [hidden]="editing" ></h5>
<input #input style="z-index: 2;" [elastic-input]="editing" [hidden]="!editing" [(ngModel)]="value" (blur)="close()">`,
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => EditableH5),
        multi: true
    }]
})
export class EditableH5 extends AbstractEditable implements AfterViewInit {
    // instance data

    @ViewChild("input")
    private input : ElementRef;
    @ViewChild("label")
    private label : ElementRef;

    // constructor

    constructor(private element : ElementRef) {
        super();
    }

    // override

    edit() {
        let nativeInput = this.input.nativeElement;
        let nativeLabel = this.label.nativeElement;

        let style = window.getComputedStyle(nativeLabel);


        nativeInput.style['backgroundColor'] = style['backgroundColor'];

        nativeInput.style['paddingTop'] = style['paddingTop'];
        nativeInput.style['marginTop'] = style['marginTop'];

        nativeInput.style['paddingBottom'] = '0px';

        super.edit();
    }

    focus() {
        setTimeout(_ => {
            this.input.nativeElement.focus();
        });
    }

    setStyle() {
        this.copyStyle(this.label.nativeElement, this.input.nativeElement);
    }
}

@Component({
    selector: "editable-button",
    host: {
        'style': 'display: inline-block; position: relative'
    },
    template: `
<button #button type="button" class="btn" style="z-index: 1;" (dblclick)="edit()">{{value}}</button>
<input #input style="position: absolute;z-index: 2;" [elastic-input]="editing" [hidden]="!editing" [(ngModel)]="value" (blur)="close()">`,
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => EditableButton),
        multi: true
    }]
})
export class EditableButton extends AbstractEditable implements AfterViewInit {
    // instance data

    @ViewChild("input")
    private input : ElementRef;
    @ViewChild("button")
    private button : ElementRef;

    // constructor

    constructor(private element : ElementRef) {
        super();
    }

    // override

    edit() {
        this.element.nativeElement.position = 'relative';

        let style = window.getComputedStyle(this.button.nativeElement);

        //this.button.nativeElement.style['position'] = 'absolute';
        this.input.nativeElement.style['backgroundColor'] = style['backgroundColor'];


        //this.input.nativeElement.style.left = style['paddingLeft'];
        this.input.nativeElement.style.top = style['paddingTop'];

        super.edit();
    }

    close() {
        this.element.nativeElement.style['position'] = 'none';

        super.close();
    }

    focus() {
        setTimeout(_ => {
            this.input.nativeElement.focus();
        });
    }

    setStyle() {
        this.copyStyle(this.button.nativeElement, this.input.nativeElement);
    }
}

