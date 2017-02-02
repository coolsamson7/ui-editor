import {
    Component,
    Input,
    ViewContainerRef,
    Directive,
    ComponentRef,
    trigger,
    state,
    style,
    transition,
    animate,
    HostListener,
    ElementRef,
    ChangeDetectorRef,
    AfterViewInit
} from "@angular/core";
import {Overlays, Overlay} from "./widgets-overlays";


@Component({
    selector: 'tooltip',
    template: `
<div [@enter]="true" class="tooltip {{ placement }}"
     [style.top]="top + 'px'"
     [style.left]="left + 'px'"
     role="tooltip">
    <div class="tooltip-arrow"></div> 
    <div class="tooltip-inner">
        <ng-content></ng-content>
        {{ content }}
    </div> 
</div>`,
    animations: [
        trigger('enter', [
            state('void', style({opacity: 0, transform: 'scale(0)'})),
            state('*', style({opacity: 1, transform: 'scale(1)'})),
            transition(':enter', [
                style({opacity: 0, transform: 'scale(0)'}),
                animate('0.2s 0.5s ease-out')
            ]),
            transition(':leave', [
                animate('0.2s 0.5s ease-out', style({opacity: 0, transform: 'scale(0)'}))
            ])
        ])
    ],
    //host: {
    //    '[@enter]': 'true'
    //}
})
export class TooltipComponent extends Overlay implements AfterViewInit {
    // instance data

    content: string;

    top: number = -100000;
    left: number = -100000;

    // constructor

    constructor(private element: ElementRef, private changeDetector: ChangeDetectorRef) {
        super();
    }

    // AfterViewInit

    ngAfterViewInit(): void {
        let position = this.calcPosition(this.element.nativeElement.children[0]);

        this.top  = position.top;
        this.left = position.left;

        this.changeDetector.detectChanges();
    }
}

@Directive({
    selector: '[tooltip]'
})
export class Tooltip {
    // instance data

    @Input()
    private tooltip: any;

    private tooltipComponent: ComponentRef<TooltipComponent>;

    private timer: any;

    // constructor

    constructor(private overlays : Overlays, private viewContainer: ViewContainerRef) {
    }

    // private

    setTimer(callback: () => void) {
        this.timer = setTimeout(callback, 500);
    }

    cancelTimer() {
        if (this.timer)
            clearTimeout(this.timer);

        this.timer = 0;
    }

    // event handling

    @HostListener("focusin")
    @HostListener("mouseenter")
    show(): void {
        if (!this.tooltipComponent && this.tooltip) {
            this.setTimer(() => {
                this.tooltipComponent = this.createTooltip(this.tooltip);
            });

        } // if
    }

    @HostListener("focusout")
    @HostListener("mouseleave")
    hide(): void {
        if (this.tooltipComponent) {
            this.tooltipComponent.destroy();

            this.tooltipComponent = undefined;
        } // if
        else if (this.timer != 0)
            this.cancelTimer();
    }


    // private

    private createTooltip(text: string): ComponentRef<TooltipComponent> {
        return this.overlays.createOverlay(this.viewContainer.element.nativeElement, "top", TooltipComponent, {
            content: text
        });
    }
}