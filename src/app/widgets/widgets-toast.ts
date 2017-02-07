import {
    Component,
    Input,
    Output,
    EventEmitter,
    ViewContainerRef,
    Directive,
    Injectable,
    ComponentFactoryResolver,
    ApplicationRef,
    ComponentRef,
    trigger,
    state,
    style,
    transition,
    animate
} from "@angular/core";


@Component({
    selector: 'toast',
    template: `
 <div class="toast type-default" [ngClass]="[toast.type, toast.theme]"  [@inOut]="animate">
    <div *ngIf="toast.showClose" class="close-button" (click)="close($event)"></div>
       
    <div *ngIf="toast.title || toast.message" class="toast-text">
       <span *ngIf="toast.title" class="toast-title">{{toast.title}}</span>
       <br *ngIf="toast.title && toast.message" />
       <span *ngIf="toast.message" class="toast-msg">{{toast.message}}</span>
    </div>
</div>`,
    animations: [
        trigger('inOut', [
            state('flyRight, flyLeft', style({opacity: 1, transform: 'translateX(0)'})),
            state('fade', style({opacity: 1})),
            state('slideDown, slideUp', style({opacity: 1, transform: 'translateY(0)'})),
            transition('void => flyRight', [
                style({
                    opacity: 0,
                    transform: 'translateX(100%)'
                }),
                animate('0.2s ease-in')
            ]),
            transition('flyRight => void', [
                animate('0.2s 10 ease-out', style({
                    opacity: 0,
                    transform: 'translateX(100%)'
                }))
            ]),
            transition('void => flyLeft', [
                style({
                    opacity: 0,
                    transform: 'translateX(-100%)'
                }),
                animate('0.2s ease-in')
            ]),
            transition('flyLeft => void', [
                animate('0.2s 10 ease-out', style({
                    opacity: 0,
                    transform: 'translateX(-100%)'
                }))
            ]),
            transition('void => fade', [
                style({
                    opacity: 0,
                }),
                animate('0.3s ease-in')
            ]),
            transition('fade => void', [
                animate('0.3s 10 ease-out', style({
                    opacity: 0,
                }))
            ]),
            transition('void => slideDown', [
                style({
                    opacity: 0,
                    transform: 'translateY(-200%)'
                }),
                animate('0.3s ease-in')
            ]),
            transition('slideDown => void', [
                animate('0.3s 10 ease-out', style({
                    opacity: 0,
                    transform: 'translateY(-200%)'
                }))
            ]),
            transition('void => slideUp', [
                style({
                    opacity: 0,
                    transform: 'translateY(200%)'
                }),
                animate('0.3s ease-in')
            ]),
            transition('slideUp => void', [
                animate('0.3s 10 ease-out', style({
                    opacity: 0,
                    transform: 'translateY(200%)'
                }))
            ]),
        ]),
    ]
})
export class Toast {
    // instance data

    animate = "flyRight"; // TODO
    @Input()
    toast : any;
    @Output('closed') closed = new EventEmitter();

    // constructor

    constructor() {
    }

    // callback

    close($event : any) {
        $event.preventDefault();

        this.closed.next(this.toast);
    }
}

@Component({
    selector: 'toast-container',
    template: `
<div class="toasts position-bottom-right">
    <toast *ngFor="let toast of toasts" [toast]="toast" (closed)="closed($event)"></toast>
</div>`
})
export class ToastContainer {
    // instance data

    private toasts : any[] = [];

    // constructor

    constructor() {
    }

    // callbacks

    closed(toast : any) {
        let index = this.toasts.indexOf(toast);

        this.toasts.splice(index, 1);
    }

    // public

    public show(type : string, message : string, title? : string, timeout? : number) {
        let toast;
        this.toasts.push(toast = {
            theme: 'theme-default', // TODO
            type: 'type-' + type,
            title: title,
            message: message,
            showClose: true // TRUE
        });

        if (timeout && timeout > 0) {
            window.setTimeout(() => {
                this.closed(toast);
            }, timeout)
        }
    }
}

@Injectable()
export class ToastService {
    // data

    private containerComponent : ComponentRef<any>;
    private container : ToastContainer;
    private rootViewContainerRef : ViewContainerRef;

    // constructor

    constructor(private componentFactoryResolver : ComponentFactoryResolver, private applicationRef : ApplicationRef) {
    }

    // private

    private getRootViewContainer() : ViewContainerRef {
        if (!this.rootViewContainerRef) {
            this.rootViewContainerRef = this.applicationRef['_rootComponents'][0]['_hostElement'].vcRef;
        }

        return this.rootViewContainerRef;
    }

    private getContainer() : ToastContainer {
        if (!this.container) {
            let toastFactory = this.componentFactoryResolver.resolveComponentFactory(ToastContainer);

            this.containerComponent = this.getRootViewContainer().createComponent(toastFactory, this.rootViewContainerRef.length);
            this.container = this.containerComponent.instance;
        } // if

        return this.container;
    }

    private show(type : string, message : string, title? : string, timeout? : number) {
        this.getContainer().show(type, message, title, timeout);
    }

    // public

    public setContainer(container : ViewContainerRef) {
        this.rootViewContainerRef = container;
    }

    // public

    public info(message : string, title? : string, timeout? : number) {
        this.show('info', message, title, timeout);
    }

    public warning(message : string, title? : string, timeout? : number) {
        this.show('warning', message, title, timeout);
    }

    public success(message : string, title? : string, timeout? : number) {
        this.show('success', message, title, timeout);
    }

    public error(message : string, title? : string, timeout? : number) {
        this.show('error', message, title, timeout);
    }
}

@Directive({
    selector: '[toast-container]'
})
export class SetToastContainer {
    // constructor

    constructor(container : ViewContainerRef, toastService : ToastService) {
        toastService.setContainer(container);
    }
}
