import {
  Component, Injector, OnDestroy, Injectable, ViewChild, AfterViewInit, AfterContentInit,
  ElementRef, OnInit
} from "@angular/core";
import {Shortcut} from "../ui/ui-shortcut";
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";

// base class for dialogs

export class Dialog {

  // static

  static currentDialog : Dialog;

  // instance data

  private title : string;
  protected dialogComponent : DialogComponent;

  // constructor

  constructor(title : string) {
    this.title = title;

    Dialog.currentDialog = this;
  }

  // public

  public setup(dialogComponent : DialogComponent) {
    this.dialogComponent = dialogComponent;

    dialogComponent.title = this.title;

    this.buildCommands();
  }


   public executeCommand(command : any) {
      return this.dialogComponent.executeCommand(command);
   }

  // protected

  protected buildCommands() : Dialog {
    return this;
  }

  public addButton(command : any) : Dialog {
    this.dialogComponent.addButton(command);

    return this;
  }
}

@Component({
  selector: 'dialog',
  template: `
<div class="modal-header">
    <button type="button" class="close" aria-label="Close" (click)="close()">
        <span aria-hidden="true">&times;</span>
    </button>
    <h3 class="modal-title" id="modal-title">{{title}}</h3>
</div>

<div class="modal-body" id="modal-body">
    <ng-content></ng-content>
</div>

<div class="modal-footer">
    <!--  [focus]="button.isDefault" -->
    <button type="button" [ngClass]="{'btn-primary': button.isDefault, 'btn-secondary': !button.isDefault}" class="btn" *ngFor="let button of buttons" (click)="clicked(button)">{{label(button)}}</button>
</div>
`
})
export class DialogComponent implements AfterContentInit, OnInit, OnDestroy {
  // callbacks

  dialog : Dialog;

  public buttons : any = [];
  public activeModal : NgbActiveModal;
  private shortcut : Shortcut;
  title = '';

  // constructor

  constructor(private injector : Injector, private elementRef : ElementRef) {
    this.activeModal = injector.get(NgbActiveModal);
    this.shortcut = injector.get(Shortcut);

    this.shortcut.addLayer();

    this.dialog = Dialog.currentDialog;
    Dialog.currentDialog = undefined;
  }

  // private

  private removeHostElement(elementRef : ElementRef) {
    let nativeElement : HTMLElement = elementRef.nativeElement;
    let parentElement : HTMLElement = nativeElement.parentElement;

    // move all children out of the element

    while (nativeElement.firstChild)
      parentElement.insertBefore(nativeElement.firstChild, nativeElement);

    // remove the empty element(the host)

    parentElement.removeChild(nativeElement);
  }

  // public

  public addButton(command : any) {
    if (command.shortCut)
      this.shortcut.register({
        shortCut: command.shortCut,
        action: () => {
          this.executeCommand(command);
        }
      });

    this.buttons.push(command);
  }

  // private

   private findCommand(commandName : string) : any {
     return this.buttons.find((button) => button.name === commandName);
   }

  private cancelCommand() {
    return this.buttons.find((button) => button.isCancel);
  }

  private defaultCommand() {
    return this.buttons.find((button) => button.isDefault);
  }

  public executeCommand(command : any) {
     if (typeof command === 'string')
        command = this.findCommand(command);

    const result = command.run();

    this.activeModal.close(result);
  }

  // callbacks

  close() {
    const cancel = this.cancelCommand();

    if (cancel)
      this.executeCommand(cancel);
    else
      this.activeModal.close(undefined);
  }

  private clicked(command : any) {
    return this.executeCommand(command);
  }

  label(command : any) : string {
    return command.label;
  }

  // OnInit

  ngOnInit() : void {
    this.removeHostElement(this.elementRef);
  }

  // AfterContentInit

  ngAfterContentInit() {
    this.dialog.setup(this);
  }

  // OnDestroy

  ngOnDestroy() {
    this.shortcut.removeLayer();
  }
}

@Injectable()
export class Dialogs {
  // constructor

  constructor(private modal : NgbModal) {
  }

  // public

  public open(content : any) : Promise<any> {
    return this.modal.open(content, {}).result;
  }
}
