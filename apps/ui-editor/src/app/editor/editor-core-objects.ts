import {Injectable} from "@angular/core";
import {AbstractEnumTypeDescriptor} from "../util/util-types";
import {ComponentRegistry, UIComponent, TemplateComponent} from "./editor-component.class";
import {Property} from "./editor-property.class";
//import {TemplateComponent} from "./editor-template-component";


@Injectable()
export class EditorObjects {
    // public

    public setup(componentRegistry : ComponentRegistry) : void {
        // syntactic sugar

        function property(name : string) {
            return new Property(name);
        }

        function template(id : string) {
            return new TemplateComponent(id);
        }

        componentRegistry
        // base

            .register(new UIComponent("base")
                .isAbstract()
                .register(property("name")
                    .setDefault("")
                    .tooltip("the technical name"))
                //.register(property("id")) // TODO
                //.register(property("repeat")
                //    .inGroup("Advanced")
                //)

                .register(property("class")
                    .tooltip("the css class")
                    .setDefault("")
                    .inGroup("Advanced"))

                .register(property("attributes") // (onChange)="onChange($event)"
                    .tooltip("arbitrary html attributes")
                    .editor("<attribute-editor [model]='model' (onChange)='onChange($event)'></attribute-editor>") // TODO more
                    .setDefault(() => {
                        return {};
                    })
                    .render((object : any, value : any) => {
                        let result = '';

                        for (let key in value)
                            result += ' ' + key + '="' + value[key] + '"';

                        return result;
                    }))
                .register(property("$counter").artificial(true))
            )

            // style

            .register(new UIComponent("style")
                .isAbstract()

                .register(property("box")
                    .tooltip("margin and padding properties")
                    .setDefault(() => {
                        return {}
                    })
                    .composite("paddingleft", "paddingtop", "paddingright", "paddingbottom", "marginleft", "margintop", "marginright", "marginbottom")
                    .editor("<box-editor [model]='model'></box-editor>")
                )

                .register(property("style")
                    .artificial(true)
                    .render((object : any, value : any) => {
                        let result = '';

                        if (object.font) {
                            if (object.font.weight)
                                result += 'font-weight: ' + object.font.weight + ';';

                            if (object.font.size)
                                result += 'font-size: ' + object.font.size + ';';

                            if (object.font.family)
                                result += 'font-family: ' + object.font.family + ';';

                            if (object.font.align)
                                result += 'text-align: ' + object.font.align + ';';

                            if (object.font.style)
                                result += 'font-style: ' + object.font.style + ';';

                            if (object.font.color)
                                result += 'color: ' + object.font.color + ';';
                        } // if

                        // box

                        if (object.box) {
                            // padding

                            for (let padding of ['left', 'top', 'right', 'bottom'])
                                if (object.box['padding' + padding])
                                    result += 'padding-' + padding + ': ' + object.box['padding' + padding] + 'px;';

                            // margin

                            for (let margin of ['left', 'top', 'right', 'bottom'])
                                if (object.box['margin' + margin])
                                    result += 'margin-' + margin + ': ' + object.box['margin' + margin] + 'px;';
                        } // if

                        return result.length > 0 ? ('style="' + result + '"') : ''; // undefined?
                    }))

                .register(property("font")
                    .tooltip("font properties")
                    .setDefault(() => {
                        return {}
                    })
                    .composite("weight", "size", "family", "align", "style", "color")
                    .editor("<font-editor [model]='model'></font-editor>"))
            )

            // body

            .register(template("body")
                .template("<div>$#children$</div>")
                .setLabel("Body")
                .setIcon("th")
                .group('Container')
            )

            // label

            .register(template("label")
                .renderTemplate("<label $r:attributes$ $r:for?=for$ $style$>${value}$</label>")
                //.editTemplate("<label $r:attributes$ $r:for?=for$ $style$>{{PROP('value')}}</label>")
                .editTemplate("<editable-label $r:attributes$ $r:for?=for$ $style$ [(ngModel)]='_model.value.value'></editable-label>")
                .setLabel("Label")
                .setIcon("font")
                .inherits("base", "style")
                .group('Widgets')
                .validParents('col', 'div', 'form', 'fieldset')
                .register(property("for")
                    .tooltip("the corresponding input field"))
                .register(property("value")
                    .tooltip("the text")
                    .tooltip("the label content")
                    .setDefault(() => "")
                    .binding(true)
                    .composite("type", "value") // is a composite!!!!!
                )
            )

            // h1

            .register(template("h1")
                .renderTemplate("<h1 $r:attributes$>${value}$</h1>")
                .editTemplate("<editable-h1 [(ngModel)]='_model.value.value'></editable-h1>")
                //.editTemplate("<h1 $r:attributes$>{{PROP('value')}}</h1>")
                .setLabel("H1")
                .setIcon("font")
                .inherits("base")
                .group('Widgets')
                .validParents('col', 'div', 'form', 'fieldset')

                .register(property("value")
                    .tooltip("the text value")
                    .setDefault(() => "")
                    .binding(true)
                    .composite("type", "value") // is a composite!!!!!
                )
            )

            // h2

            .register(template("h2")
                .renderTemplate("<h2 $r:attributes$>${value}$</h2>")
                .editTemplate("<editable-h2 [(ngModel)]='_model.value.value'></editable-h2>")
                //.editTemplate("<h2 $r:attributes$>{{PROP('value')}}</h2>")
                .setLabel("H2")
                .setIcon("font")
                .inherits("base")
                .group('Widgets')
                .validParents('col', 'div', 'form', 'fieldset')

                .register(property("value")
                    .tooltip("the text value")
                    .setDefault(() => "")
                    .binding(true)
                    .composite("type", "value") // is a composite!!!!!
                )
            )

            // h3

            .register(template("h3")
                .renderTemplate("<h3 $r:attributes$>${value}$</h3>")
                .editTemplate("<editable-h3 [(ngModel)]='_model.value.value'></editable-h3>")
                //.editTemplate("<h3 $r:attributes$>{{PROP('value')}}</h3>")
                .setLabel("H3")
                .setIcon("font")
                .inherits("base")
                .group('Widgets')
                .validParents('col', 'div', 'form', 'fieldset')

                .register(property("value")
                    .tooltip("the text value")
                    .setDefault(() => "")
                    .binding(true)
                    .composite("type", "value") // is a composite!!!!!
                )
            )

            // h4

            .register(template("h4")
                .renderTemplate("<h4 $r:attributes$>${value}$</h4>")
                .editTemplate("<editable-h4 [(ngModel)]='_model.value.value'></editable-h4>")
                //.editTemplate("<h4 $r:attributes$>{{PROP('value')}}</h4>")
                .setLabel("H4")
                .setIcon("font")
                .inherits("base")
                .group('Widgets')
                .validParents('col', 'div', 'form', 'fieldset')

                .register(property("value")
                    .tooltip("the text value")
                    .setDefault(() => "")
                    .binding(true)
                    .composite("type", "value") // is a composite!!!!!
                )
            )

            // h5

            .register(template("h5")
                .renderTemplate("<h5 $r:attributes$>${value}$</h5>")
                .editTemplate("<editable-h5 [(ngModel)]='_model.value.value'></editable-h5>")
                //.editTemplate("<h5 $r:attributes$>{{PROP('value')}}</h5>")
                .setLabel("H5")
                .setIcon("font")
                .inherits("base")
                .group('Widgets')
                .validParents('col', 'div', 'form', 'fieldset')

                .register(property("value")
                    .tooltip("the text value")
                    .setDefault(() => "")
                    .binding(true)
                    .composite("type", "value") // is a composite!!!!!
                )
            )

            // br

            .register(template("br")
                .template("<br $r:attributes$>")
                .setLabel("Br")
                .setIcon("font")
                .inherits("base")
                .group('Widgets')
                .validParents('col', 'div', 'form', 'fieldset')
            )

            // p

            .register(template("p")
                .renderTemplate("<p $r:attributes$  $style$>${value}$</p>")
                .editTemplate("<p $r:attributes$ $style$>{{PROP('value')}}</p>")
                .setLabel("Paragraph")
                .setIcon("font")
                .inherits("base", "style")
                .group('Widgets')
                .validParents('col', 'div', 'form', 'fieldset')

                .register(property("value")
                    .tooltip("the text value")
                    .setDefault(() => "")
                    .binding(true)
                    .composite("type", "value") // is a composite!!!!!
                )
            )

            // hr

            .register(template("hr")
                .template('<hr $r:attributes$ />')
                .setLabel("Line")
                .setIcon("font")
                .inherits("base", "style")
                .group('Widgets')
                .validParents('col', 'div', 'form', 'fieldset', 'body')

                .register(property("value")
                    .tooltip("the text value")
                    .setDefault(() => "")
                    .binding(true)
                    .composite("type", "value") // is a composite!!!!!
                )
            )

            // div

            .register(template("div")
                .template("<div $class?=class$ $r:attributes$>$#children$</div>")
                .setLabel("Div")
                .setIcon("th")
                .inherits("base")
                .group('Container')
                .validParents('body', 'form', 'col', 'fieldset')
            )

            // form

            .register(template("form")
                .template("<form $name?=name$ novalidate='' $class?=class$ $r:attributes$>$#children$</form>")
                .setLabel("Form")
                .setIcon("th")
                .inherits("base")
                .group('Container')
                .validParents('body', 'form', 'col', 'fieldset')
            )

            // fieldset

            .register(template("fieldset")
                .template('<fieldset class="group" $r:attributes$><legend>${value}$</legend>$#children$</fieldset>')
                .editTemplate('<fieldset class="group" $r:attributes$><legend>{{PROP("value")}}</legend>$#children$</fieldset>')
                .setLabel("Fieldset")
                .setIcon("th")
                .inherits("base")
                .group('Container')
                .validParents('body', 'div', 'col', 'form')
                .register(property("value")
                    .setDefault(() => "")
                    .binding(true)
                    .composite("type", "value"))
            )

            // checkbox

            .register(template("checkbox")
                .template('<div class="checkbox"><label><input type="checkbox" $name?=name$ $[(ngModel)]?=model$ $r:attributes$/>${label}$</label></div>')
                .setLabel("Checkbox")
                .setIcon("th")
                .inherits("base")
                .group('Inputs')
                .validParents('body', 'form', 'col', 'fieldset')
                .register(property("label")
                    .tooltip("the label")
                    .inGroup("Advanced")
                    .setDefault(() => "")
                    .binding(true)
                    .composite("type", "value"))
                .register(property("model").inGroup("Advanced"))
            )

            // button

            .register(template("button")
                .template('<button type="button" $(click)?=click$ class="btn $class$" $r:attributes$>${text}$</button>')
                //.editTemplate('<button type="button" class="btn $class$" $r:attributes$>{{PROP("text")}}</button>')
                .editTemplate('<editable-button [(ngModel)]="_model.text.value"></editable-button>')
                .setLabel("Button")
                .setIcon("th")
                .inherits("base")
                .group('Inputs')
                .validParents('div', 'col')
                .register(property("text")
                    .tooltip("the button text")
                    .setDefault(() => "")
                    .binding(true)
                    .composite("type", "value"))
                .register(property("click")
                    .setDefault(() => ""))
            )

            // radio-button

            .register(template("radio-button")
                .template('<div class="radio"><label><input type="radio" $name?=name$ $value?=value$ $[(ngModel)]?=model$ $r:attributes$/>${label}$</label></div>')
                .setLabel("Radio")
                .setIcon("th")
                .inherits("base")
                .group('Inputs')
                .validParents('body', 'form', 'col', 'fieldset')
                .register(property("label")
                    .tooltip("the radio button label")
                    .inGroup("Advanced")
                    .setDefault(() => "")
                    .binding(true)
                    .composite("type", "value"))
                .register(property("value"))
                .register(property("model")
                    .tooltip("the angular binding")
                    .inGroup("Advanced"))
            )

            // input

            .register(template("input") // $id?=id$  $r:validation$ form-control {{$rightAligned$===true?\'right-align-content\':\'\'}}" $r:"data-error-decorator"$
                .template('<input $name?=name$ $type?=type$ $placeholder?=placeholder$ $[(ngModel)]?=model$ $r:[required]=required$ $r:[disabled]=disabled$ $e:"disabled"$ $class?=class$  $r:attributes$/>')
                .setLabel("Input")
                .setIcon("th")
                .inherits("base")
                .group('Inputs')
                .validParents('col', 'div')

                .register(property("required")
                    .tooltip("the required property")
                    .binding(true)
                    .composite("type", "value")
                    .setType("boolean")
                    .setDefault(false))

                .register(property("placeholder")
                    .tooltip("the placeholder text")
                    .setDefault(() => "")
                    .binding(true)
                    .composite("type", "value"))

                .register(property("type")
                    .tooltip("the input type ( text or number )")
                    .setType(new AbstractEnumTypeDescriptor("text", "number")) // TODO more?!
                    .setDefault(undefined))

                .register(property("disabled")
                    .tooltip("the disabled property")
                    .binding(true)
                    .setType("boolean")
                    .composite("type", "value")
                    .setDefault(false))

                .register(property("model")
                    .inGroup("Advanced"))
            )

            // text area $id?=id$

            .register(template("textarea")
                .template('<textarea class="form-control" $name?=name$ $rows?=rows$ $maxlength?=max-length$ $placeholder?=placeholder$ $[(ngModel)]?=model$ $r:[required]=required$ $r:[disabled]=disabled$ $e:"disabled"$  $r:attributes$></textarea>')
                .setLabel("Text")
                .setIcon("th")
                .inherits("base", "style")
                .group('Widgets')
                .validParents('col')

                .register(property("placeholder")
                    .setDefault(() => "")
                    .binding(true)
                    .composite("type", "value"))

                .register(property("rows")
                    .setDefault(2))

                .register(property("max-length")
                    .setDefault(undefined))

                .register(property("required")
                    .setDefault(false)
                    .binding(true)
                    .composite("type", "value"))

                .register(property("disabled")
                    .setDefault(false)
                    .binding(true)
                    .composite("type", "value"))

                .register(property("model")
                    .setDefault(""))

                .register(property("label")
                    .inGroup("Advanced")
                    .setDefault(() => "")
                    .binding(true)
                    .composite("type", "value"))

                .register(property("value"))

                .register(property("model").inGroup("Advanced"))
            )

            // select box  $id?=id$

            .register(template("select-box")
                .template('<select class="form-control" $name?=name$ $r:[(ngModel)]?=model$ $r:[required]=required$ $r:[disabled]=disabled$  $e:"disabled"$ $r:attributes$><option [ngStyle]="\'$emptyOption$\' == \'\' ? { display:\'none\' } : {}" value="">$emptyOption$</option><option *ngFor="let value of $options$" [ngValue]="value">{{value}}</option></select>')
                .setLabel("Combo")
                .setIcon("th")
                .inherits("base", "style")
                .group('Widgets')
                .validParents('col')
                .register(property("required")
                    .setDefault(false)
                    .binding(true)
                    .composite("type", "value"))
                .register(property("disabled")
                    .setDefault(false)
                    .binding(true)
                    .composite("type", "value"))

                .register(property("model")
                    .setDefault(""))

                .register(property("options")
                    .setDefault(""))

                .register(property("emptyOption")
                    .setDefault("")
                    .binding(true)
                    .composite("type", "value")))
            // row

            .register(template("row")
                .template("<div class='row'>$#children$</div>")
                .setLabel("Row")
                .setIcon("option-horizontal")
                .inherits('base')
                .group('Layout')
                .orientation('ver')
                .validParents('body', 'col', 'fieldset', 'div', 'form')
                .decorator((model : any, row : any) => {
                    // count rows

                    let count = 0;
                    for (let child of model.children) {
                        count += child.columns ? child.columns : 2;
                        count += child.offset ? child.offset : 0;
                    } // for

                    // fill up to 12
                    if (!row) return;

                    let div = row.parentElement;
                    let editComponent = div.parentElement;

                    editComponent.classList.add('row', 'form-edit');
                    div.classList.remove('row', 'form-edit');
                    row.classList.remove('row', 'form-edit');

                    for (count; count < 12; count++) {
                        let div = document.createElement('div');

                        div.classList.add("form-edit", "col-md-1", "col-placeholder", ['col-placeholder-odd', 'col-placeholder-even'][count % 2]);

                        // style="float:right;?

                        row.appendChild(div);
                    } // for


                    if (!model.children || model.children.length == 0)
                        row.classList.add('rowBackground');
                }))

            // col

            .register(template("col")
                .template("<div class='col col-md-$columns$ col-md-offset-$offset$'>$#children$</div>")
                .setLabel("Column")
                .setIcon("option-vertical")
                .inherits('base')
                .group('Layout')
                .validParents('row')
                .register(property("columns").setType("number").setDefault(2))
                .register(property("offset").setType("number").setDefault(0))
                .decorator((model : any, col : any) => {
                    // hierarchy is <el> -> ng-comp -> <div drag... > -> <edit-compoennt>

                    if (!col) return;

                    let div = col.parentElement;
                    let editComponent = div.parentElement;

                    let columns = 'col-md-' + (model.columns ? model.columns : 2);
                    let offset = 'col-md-offset-' + (model.offset ? model.offset : 0);

                    while (editComponent.classList.length > 0)
                        editComponent.classList.remove(editComponent.classList.item(0));

                    editComponent.classList.add('col', 'form-edit', columns, offset);

                    div.classList.remove('col', 'form-edit', columns, offset);
                    col.classList.remove('col', 'form-edit', columns, offset);

                    if (!model.children || model.children.length == 0) {
                        col.classList.add('columnBackground');
                    }
                }));
    }
}
