import {Component, Input, OnInit, Output, EventEmitter, TemplateRef, Directive, ElementRef} from "@angular/core";


@Component({ //[ngTransclude]="tab.header"
    selector: 'tabs', host: {
        'style': 'height: inherit; display: flex; flex-direction: column;'
    },
    template: `
    <ul class="tabs">
      <li *ngFor="let tab of visibleTabs()" (click)="selectTab(tab)" [class.active]="tab.active" [ngClass]="tab.icon">
        <ng-container
    *ngTemplateOutlet="tab.header; context: {tab: tab}">{{tab.label}}</ng-container>
      </li>
    </ul>
    <ng-content></ng-content>
  `,
})
export class Tabs {
    // output

    @Output('onSelect') onSelect = new EventEmitter<any>();

    // data

    private tabs : Tab[] = [];

    // private

    visibleTabs() : Tab[] {
        return this.tabs.filter((tab) => tab.visible);
    }

    // public

    public setVisible(name : string, visible : boolean) : void {
        let i = 0;
        for (let tab of this.tabs) {
            if (tab.name == name) {
                tab.visible = visible;

                // select new tab...

                if (!visible && tab.active) {
                    tab.active = false;

                    if (i == this.tabs.length - 1) {
                        if (i > 0)
                            this.selectTab(this.tabs[i - 1]);
                    }
                    else
                        this.selectTab(this.tabs[i + 1]);

                }
            } // if

            i++;
        }
    }

    // public

    public selectTabByName(name : string) {
        this.selectTab(this.tabs.find((tab) => tab.name == name));
    }

    // callbacks

    selectTab(tab : Tab) {
        this.tabs.forEach((tab) => {
            tab.active = false;
        });

        tab.active = true;

        if (this.onSelect)
            this.onSelect.emit(tab);
    }

    // called by the child

    addTab(tab : Tab) {
        if (this.tabs.length === 0)
            tab.active = true;

        this.tabs.push(tab);
    }
}

@Component({
    selector: 'tab', host: {
        'style': 'flex-grow: 0; flex-basis: auto; overflow: scroll;'
    },
    template: `
    <div class="tab" [hidden]="!active"  [ngClass]="{'active': active}">
      <ng-content></ng-content>
    </div>
  `
})
export class Tab implements OnInit {
    // data

    @Input('name')
    public name : string = "";
    @Input('title')
    label : string = "";
    @Input('icon')
    public icon : string = "";
    active : boolean = false;
    visible : boolean = true;

    header : TemplateRef<any>;

    // constructor

    constructor(private tabs : Tabs, private element : ElementRef) {

    }

    public bounds() : ClientRect {
        return this.element.nativeElement.getBoundingClientRect();
    }

    // lifecycle

    ngOnInit() {
        this.tabs.addTab(this);
    }
}

// this directive is only needed to transfer the template to the tab in order to get transcluded!

@Directive({
    selector: '[tabheader]'
})
export class TabHeader {
    // constructor


    constructor(tab : Tab, header : TemplateRef<any>) {
        tab.header = header;
    }
}
