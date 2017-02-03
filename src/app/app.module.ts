import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

//import { Ng2BootstrapModule } from 'ng2-bootstrap/ng2-bootstrap';

import { AppComponent } from './app.component';
import {
  RenderFactory, ComparatorFactory, NgTableComponent,
  NgTableSortingDirective
} from "./widgets/widgets-table.component";
import {ComponentRegistry, ComponentFactoryBuilder} from "./editor/editor-component.class";
import {Tracer} from "./util/util-trace";
import {
  PropertyEditorBuilder, PropertyLabelComponent, EditorGroupComponent,
  ComponentEditorComponent, ValueOrBindingEditor, PropertyEditorComponent, AttributeEditorComponent,
  BooleanPropertyComponent, EnumPropertyComponent
} from "./editor/editor-property-editor";
import {TreeComponentBuilder, TreeComponent, TreeNode, NodeContent} from "./widgets/widgets-tree";
import {EditorObjects} from "./editor/editor-core-objects";
import {EditorService} from "./editor/editor-service";
import {Shortcut} from "./ui/ui-shortcut";
import {ToastService, ToastContainer, SetToastContainer, Toast} from "./widgets/widgets-toast";
import {Overlays} from "./widgets/widgets-overlays";
import {DownloadService} from "./util/util-download";
import {DragSourceComponent, DropTargetComponent} from "./ui/ui-dd.directive";
import {ComponentGroupComponent, PaletteComponent} from "./editor/editor-palette.component";
import {ComponentTreeComponent} from "./editor/editor-component-tree";
import {EditorComponent} from "./editor/editor.component";
import {ComponentDirective, EditComponent} from "./editor/editor-edit-component.component";
import {RenderComponent} from "./editor/editor-render-component.component";
import {UIEditorComponent, OpenFileDialog} from "./editor/editor-ui-editor.component";
import {SplitPane, SplitPanel, Splitter} from "./widgets/widgets-splitter";
import {
  FontEditor, PropertyChoiceButtons, PropertyButton,
  PropertyChoiceCombo, BoxComponent
} from "./editor/editor-property-editor-components";
import {Tabs, Tab, TabHeader} from "./widgets/widgets-tabs";
import {
  EditableLabel, ElasticInputDirective, EditableH1, EditableH2, EditableH3,
  EditableH4, EditableH5, EditableButton
} from "./widgets/ui-inplace-edit";
import {TriangleComponent, Confirm, ConfirmWindow, MenuContent, ContextMenu} from "./widgets/widgets-context-menu";
import {Tooltip, TooltipComponent} from "./widgets/widgets-tooltip";
import {FocusDirective} from "./util/util-focus";
import {Breadcrumb} from "./widgets/widgets-breadcrumb";
import {Floater, Floating} from "./widgets/widgets-floater";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {CommonModule} from "@angular/common";


const services = [
  RenderFactory, ComparatorFactory,
  ComponentRegistry, ComponentFactoryBuilder,

  Tracer,

  PropertyEditorBuilder,

  TreeComponentBuilder,
  EditorObjects, EditorService,

  Shortcut,

  ToastService,
  Overlays,

  DownloadService
];

const components = [
  NgTableComponent,NgTableSortingDirective,

  UIEditorComponent, EditComponent, RenderComponent, ComponentDirective, PropertyEditorComponent, EditorComponent, ValueOrBindingEditor,ComponentTreeComponent,
  PaletteComponent, ComponentEditorComponent, EditorGroupComponent, PropertyLabelComponent, ComponentGroupComponent,


  DragSourceComponent, DropTargetComponent,

  TreeComponent, TreeNode, NodeContent,

  SplitPane, SplitPanel, Splitter,

  FontEditor, PropertyChoiceButtons, PropertyButton, PropertyChoiceCombo, BoxComponent, AttributeEditorComponent, BooleanPropertyComponent, EnumPropertyComponent, // editors

  Tabs, Tab,TabHeader,

  EditableLabel, ElasticInputDirective, EditableH1, EditableH2, EditableH3, EditableH4, EditableH5, EditableButton,

  TriangleComponent,

  Confirm, ConfirmWindow,

  ToastContainer, SetToastContainer, Toast,

  Tooltip, TooltipComponent,

  OpenFileDialog,

  FocusDirective,

  Breadcrumb
];

@NgModule({
  declarations: [ EditComponent,
    ...components,

    ContextMenu, MenuContent,
    Floating, Floater,
    AppComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    HttpModule,

    //Ng2BootstrapModule.forRoot(),
    NgbModule.forRoot(),
  ],
  providers: [
    ...services
  ],
  entryComponents: [
    MenuContent,
    ConfirmWindow,
    Floater,
    ToastContainer,
    TooltipComponent,

    // dialogs

    OpenFileDialog
  ],
  exports: [
    ...components,

    CommonModule,
    FormsModule,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
