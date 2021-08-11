import {Injectable} from "@angular/core";
import {ComponentRegistry, UIComponent} from "./editor-component.class";

@Injectable()
export class EditorService {
    // constructor

    constructor(private componentRegistry : ComponentRegistry) {
    }

    // public

    public diff(o1 : any, o2 : any) : boolean {
        let descriptor : UIComponent = this.componentRegistry.find(o1.id);

        let diffs = [];
        for (let property of descriptor.getProperties()) {
            let prop = property.name;

            if (!prop.startsWith("$")) {
                let v1 = o1[prop];
                let v2 = o2[prop];

                property.compare(v1, v2, prop, diffs);
            } // if
        }

        // done

        return diffs.length > 0;
    }

    public copyProperties(node : any, result : any) : void {
        let descriptor : UIComponent = this.componentRegistry.find(node.id);

        for (let property of descriptor.getProperties())
            if (!property.name.startsWith("$"))
                result[property.name] = property.copyValue(node[property.name]);
    };

    public copyModel(root : any, recursive : boolean) : any { // what about the defaults...
        // local function

        let self = this;

        function copy(node : any, recursive : boolean) {
            let result : any = {
                id: node.id
            };

            self.copyProperties(node, result);

            // recursion

            if (recursive && node.children)
                result.children = node.children.map((node) => copy(node, recursive));

            return result;
        }

        return copy(root, recursive);
    }

    public stripModel(root : any) : any {
        let deleteDefaultProperties = (node : any) => {
            let descriptor : UIComponent = this.componentRegistry.find(node.id);

            descriptor.deleteDefaults(node);
        };

        function strip(node : any) {
            delete node.$parent; // break recursion

            deleteDefaultProperties(node);

            if (node.children)
                for (let child of node.children)
                    strip(child);
        }

        return strip(root);
    }

    public connectModel(root : any) : void {
        let initializeProperties = (node : any) => {
            let descriptor : UIComponent = this.componentRegistry.find(node.id);

            descriptor.addDefaults(node);
        };

        function connect(parent : any, node : any) {
            if (parent)
                node.$parent = parent;

            initializeProperties(node);

            if (node.children)
                for (let child of node.children)
                    connect(node, child);
        }

        connect(undefined, root);
    }

}
