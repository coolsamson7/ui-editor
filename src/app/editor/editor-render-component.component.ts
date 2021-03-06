import {
    ComponentRef,
    Input,
    SimpleChanges,
    ViewContainerRef,
    OnChanges,
    Component,
    ViewChild,
    Injectable,
    ComponentFactory,
    Compiler,
    NgModule
} from "@angular/core";
import {ComponentRegistry} from "./editor-component.class";
import {AppModule} from "../app.module";


@Injectable()
@Component({
    selector: '[render-component]',
    template: `
<div #container></div>
`
})
export class RenderComponent implements OnChanges {
    // instance data

    public versionCounter : number = 1;
    @Input()
    private component : any;
    @Input()
    private context : any;
    @ViewChild('container', {read: ViewContainerRef})
    private container : ViewContainerRef;
    private componentRef : ComponentRef<any>;
    @Input('render-component')
    private visible;

    // constructor

    constructor(private componentRegistry : ComponentRegistry, private compiler : Compiler) {
    }

    // private

    public buildFactory(template : string, ...inputs : string[]) : ComponentFactory<any> {
        @Component({
            inputs: inputs,
            template: template
        })
        class TemplateComponent {
        }

        // the module

        @NgModule({
            imports: [AppModule], // TODO
            declarations: [TemplateComponent]
        })
        class TemplateModule {
        }

        // compile and create

        let module = this.compiler.compileModuleAndAllComponentsSync(TemplateModule);

        return module.componentFactories.find((comp) =>
            comp.componentType === TemplateComponent
        );

    }

    public render() {
        let html = this.componentRegistry.find(this.component.id).render(this.component, false);

        this.update(html);
    }

    public update(html : string) {
        if (this.componentRef)
            this.componentRef.destroy();

        let factory = this.buildFactory(html);

        this.componentRef = this.container.createComponent(factory);

        // pass data

        let instance : any = this.componentRef.instance;

        instance.__proto__ = this.context; // :-) // constructor.prototype!
    }

    // implement OnChanges

    ngOnChanges(changes : SimpleChanges) : void {
        if (this.visible)
            this.render();
    }
}
