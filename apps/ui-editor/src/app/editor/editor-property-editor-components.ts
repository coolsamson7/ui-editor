import {Component, Injectable, OnChanges, SimpleChanges, Input, OnDestroy} from "@angular/core";

@Injectable()
@Component({
    selector: 'box-editor',
    template: `
<div class="box-editor col-md-12">
    <div class="top">
        <input type="number" class="marginTop" [(ngModel)]="model.margintop"/>
    </div>
    <div class="middle">
        <input type="number" class="marginLeft" [(ngModel)]="model.marginleft"/>
        <div class="rightLeft paddingBox">
            <div class="top">
                <input type="number" class="paddingTop" [(ngModel)]="model.paddingtop"/>
            </div>
            <div class="middle">
                <input type="number" class="paddingLeft" [(ngModel)]="model.paddingleft"/>
                <div class="rightLeft">&nbsp;</div>
                <input type="number" class="paddingRight" [(ngModel)]="model.paddingright"/>
            </div>
            <div class="bottom">
                <input type="number" class="paddingBottom" [(ngModel)]="model.paddingbottom"/>
            </div>
        </div>
        <input type="number" class="marginRight" [(ngModel)]="model.marginright"/>
    </div>
    <div class="bottom">
        <input type="number" class="marginBottom" [(ngModel)]="model.marginbottom"/>
    </div>
</div>
`
})
export class BoxComponent implements OnChanges {
    // data

    @Input()
    model : any;

    // constructor

    constructor() {
    }

    // OnChanges

    ngOnChanges(changes : SimpleChanges) : void {
        if (!this.model.box)
            this.model.box = {};

        this.model = this.model.box;
    }
}


@Injectable()
@Component({
    selector: 'property-button',
    template: `
<ul class="selectButtons">
   <li (click)="toggle()" [ngClass]="{'selected': model[property]}">
       <i *ngIf="!icon">{{label}}</i>
       <span *ngIf="icon" class="glyphicon glyphicon-{{icon}}"></span>
   </li>
</ul>
`
})
export class PropertyButton implements OnChanges {
    // data

    @Input()
    model : any;
    @Input()
    property : string;
    @Input()
    value : string;
    @Input()
    label : string;
    @Input()
    icon : string;

    // constructor

    constructor() {
    }

    // callbacks

    toggle() {
        if (this.model[this.property])
            delete this.model[this.property];
        else
            this.model[this.property] = this.value;
    }

    // OnChanges

    ngOnChanges(changes : SimpleChanges) : void {
    }
}

@Injectable()
@Component({
    selector: 'property-choice-buttons',
    template: `
<ul class="selectButtons">
   <li *ngFor="let value of values; let i = index" (click)="select(value)" [ngClass]="{'selected': model[property] == value}">
       <i *ngIf="!icons">{{labels[i]}}</i>
       <span *ngIf="icons" class="glyphicon glyphicon-{{icons[i]}}"></span>
   </li>
</ul>
`
})
export class PropertyChoiceButtons implements OnChanges {
    // data

    @Input()
    model : any;
    @Input()
    property : string;
    @Input()
    values : string[];
    @Input()
    labels : string[];
    @Input()
    icons : string[];

    // constructor

    constructor() {
    }

    // callbacks

    select(value : any) {
        this.model[this.property] = value;
    }

    // OnChanges

    ngOnChanges(changes : SimpleChanges) : void {
    }
}

@Component({
    selector: 'property-choice-combo',
    template: `<ul class="selectButtons">
<i class="glyphicon glyphicon-{{icon}} selectPropertyIcon"></i>
<select class="selectPropertyElement" [(ngModel)]="value" (ngModelChange)="onChange($event)">
    <option *ngFor="let value of values; let i = index" [ngValue]="value">{{labels[i]}}</option>
 </select></ul>
`
})
export class PropertyChoiceCombo implements OnChanges {
    // data

    @Input()
    model : any;
    @Input()
    icon : string;
    @Input('property')
    property : string;
    @Input()
    values : string[];
    @Input()
    labels : string[];

    value;

    // constructor

    constructor() {
    }

    // callbacks

    onChange(value) {
        this.model[this.property] = value;
    }

    // OnChanges

    ngOnChanges(changes : SimpleChanges) : void {
        if (this.model[this.property] == undefined)
            this.model[this.property] = this.values[0];

        this.value = this.model[this.property];
        if (!this.labels)
            this.labels = this.values;
    }
}

@Injectable()
@Component({
    selector: 'font-editor',
    template: `
<!-- align -->

<property-choice-buttons [model]="model.font" [property]="'align'" [icons]="['align-left', 'align-center', 'align-right']" [values]="['left', 'center', 'right']"></property-choice-buttons>

<!-- italic -->

<property-button [model]="model.font" [property]="'style'" [value]="'italic'" [icon]="'italic'"></property-button>

<!-- weight -->

<div class="row">
    <div class="col-md-12">
       <property-choice-combo [model]="model.font" [property]="'weight'" [values]="weightValues" [labels]="weightLabels" [icon]="'bold'"></property-choice-combo>
    </div>
    
    <!-- size -->
    
    <div class="col-md-12">
       <property-choice-combo [model]="model.font" [property]="'size'" [values]="sizeValues" [labels]="sizeLabels" [icon]="'text-height'"></property-choice-combo>
    </div>
    
   
    <!-- family -->
    
    <div class="col-md-12">
       <property-choice-combo [model]="model.font" [property]="'family'" [values]="familyValues" [icon]="'font'"></property-choice-combo>
    </div>
</div>
`

})
export class FontEditor implements OnChanges, OnDestroy {
    // data

    @Input('model')
    model : any;

    weightValues = [undefined, 'normal', 'bold', '100', '200', '300', '300', '500', '600', '700', '800', '900'];
    weightLabels = ['-', 'normal', 'bold', '100', '100', '200', '300', '300', '500', '600', '700', '800', '900'];

    sizeValues = [undefined, 'inherit', 'small', 'medium', 'large'];
    sizeLabels = ['-', 'normal', 'inherit', 'small', 'medium', 'large'];

    familyValues = [undefined, 'Arial', 'Verdana']; // TODO

    // constructor

    constructor() {
    }

    // private

    private checkProperty(object : any, property : string) {
        if (object.hasOwnProperty(property)) {
            if (object[property] == undefined)
                delete object[property];
            else
                return true;
        } // if

        return false;
    }

    // OnChanges

    ngOnChanges(changes : SimpleChanges) : void {
        if (!this.model.font)
            this.model.font = {};
    }

    // OnDestroy

    ngOnDestroy() : void {
        let font = this.model.font;

        let nonEmpty =
            this.checkProperty(font, "family") ||
            this.checkProperty(font, "size") ||
            this.checkProperty(font, "weight");

        //if (!nonEmpty)
        //    delete this.model.font;
    }
}
