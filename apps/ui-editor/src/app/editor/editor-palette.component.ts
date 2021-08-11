import {Component, Injectable, OnChanges, SimpleChanges, Input} from "@angular/core";
import {UIComponent, ComponentRegistry} from "./editor-component.class";


@Component({
    selector: 'component-group',
    template: `
<div class="editor-group col-md-12" [ngClass]="{'open': open}" >
    <!-- the title -->
    
    <div class="title" (click)="toggle()">
        <span [ngClass]="{'glyphicon-chevron-down': open, 'glyphicon-chevron-right': !open}" class="glyphicon toggleIcon"></span> {{group.name}}
    </div>
    
    <!-- the body -->
    
    <div class="body" [hidden]="!open">
        <div class="component" *ngFor="let component of group.components" (click)="selectComponent(component)" [drag-source]="component"  [ngClass]="{'selected': component === selectedComponent}" class="component-icon col-md-3 component" >
            <span class="glyphicon glyphicon-{{component.icon}} fa-2x"></span>
            <div>{{component.label}}</div>
        </div>
    </div>
</div>
`
})
export class ComponentGroupComponent {
    // data

    @Input()
    group : any;
    open : boolean = true;

    private selectedComponent : UIComponent;

    // constructor

    constructor() {

    }

    // callbacks

    toggle() {
        this.open = !this.open;
    }

    // callbacks

    selectComponent(component : UIComponent) {
        this.selectedComponent = component;
    }
}

@Injectable()
@Component({
    selector: 'palette-editor',
    template: `
<div class="editor-groups">
    <component-group *ngFor="let group of groups" [group]="group">
    </component-group>
</div>
`
})
export class PaletteComponent implements OnChanges {
    // instance data

    groups : any[];

    // constructor

    constructor(componentRegistry : ComponentRegistry) {
        this.groups = this.buildGroups(componentRegistry.components);//getComponents());
    }

    // private


    buildGroups(components : /*IterableIterator<UIComponent>*/Map<string,UIComponent>) : any[] {
        let result = [];

        let map = {};

        components.forEach((component, key) => {
            if (!component.abstract) {
                let group = map[component._group];

                if (!group) {
                    group = {
                        name: component._group,
                        components: []
                    };

                    map[component._group] = group;

                    result.push(group);
                } // if

                group.components.push(component); // what about sorting?
            } // if
        });

        return result;
    }

    // implement OnChanges

    ngOnChanges(changes : SimpleChanges) : void {
    }
}
