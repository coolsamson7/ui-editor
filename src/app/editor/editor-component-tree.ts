import {OnInit, Input, AfterViewInit, OnDestroy, Component, ViewChild} from "@angular/core";
import {TreeComponent} from "../widgets/widgets-tree";

@Component({
    selector: 'component-tree',
    host: {
        'style': 'height: 100%'
    },
    template: `
<div class="component-tree" style="height: inherit">
   <tree [model]="model"></tree>
</div>`
})
export class ComponentTreeComponent implements AfterViewInit, OnInit, OnDestroy {
    // instance data

    @Input()
    private model: any;
    @Input('root')
    private root : any;
    @ViewChild(TreeComponent)
    private tree: TreeComponent;

    // constructor

    constructor() {
    }

    // private

    private createPath(model : any) : any[] {
        function find(node, path : any[], match) : boolean {
            path.push(node);

            if (node === match) {
                return true;
            }
            else if (node.children) {
                for (let child of node.children) {
                    if (find(child, path, match))
                        return true;

                    path.pop();
                } // for

                return false;
            }
        }

        let path = [];

        find(this.root, path, model);

        return path;
    }

    // public

    public select(model) {
        this.tree.selectNode(model);
    }

    expandPath(path: any[]) {
        this.tree.expandPath(path);
    }

    // OnInit

    ngOnInit(): void {
    }

    // AfterViewInit

    ngAfterViewInit(): void {
        this.model.onSelect.subscribe((selection) => {
            this.tree.expandPath(this.createPath(selection));
        });
    }

    // OnDestroy

    ngOnDestroy(): void {
    }
}