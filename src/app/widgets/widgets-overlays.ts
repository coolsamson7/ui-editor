import {
    ViewContainerRef, ComponentFactoryResolver, ComponentRef, ApplicationRef, Type,
    Injectable, AfterViewInit, ElementRef, ChangeDetectorRef
} from "@angular/core";


export interface OverlayPlacement {
    host: HTMLElement;
    position : string;
}

export class Overlay {
    // instance data

    placement : OverlayPlacement;

    // protected

    protected calcPosition(element: HTMLElement) : { top: number, left: number }  {
        return this.place(this.placement.host, element, this.placement.position, true);
    }

    private place(host: HTMLElement, target: HTMLElement, placement: string, appendToBody: boolean = false): { top: number, left: number } {
        let positionStrParts = placement.split("-");

        let hor  = positionStrParts[0];
        let vert = positionStrParts[1] || "center";

        let hostPos = appendToBody ? this.offset(host) : this.position(host);

        let targetWidth = target.offsetWidth;
        let targetHeight = target.offsetHeight;

        let shiftWidth: any = {
            center: function (): number {
                return hostPos.left + hostPos.width / 2 - targetWidth / 2;
            },

            left: function (): number {
                return hostPos.left;
            },

            right: function (): number {
                return hostPos.left + hostPos.width;
            }
        };

        let shiftHeight: any = {
            center: function (): number {
                return hostPos.top + hostPos.height / 2 - targetHeight / 2;
            },

            top: function (): number {
                return hostPos.top;
            },

            bottom: function (): number {
                return hostPos.top + hostPos.height;
            }
        };

        switch (hor) {
            case "right":
                return {
                    top: shiftHeight[vert](),
                    left: shiftWidth[hor]()
                };

            case "left":
                return {
                    top: shiftHeight[vert](),
                    left: hostPos.left - targetWidth
                };

            case "bottom":
                return {
                    top: shiftHeight[hor](),
                    left: shiftWidth[vert]()
                };

            default:
                return {
                    top: hostPos.top - targetHeight,
                    left: shiftWidth[vert]()
                };
        } // switch
    }

    // private

    private position(nativeEl: HTMLElement): { width: number, height: number, top: number, left: number } {
        let offsetParentBCR = {top: 0, left: 0};

        const elBCR = this.offset(nativeEl);

        const offsetParentEl = this.parentOffsetEl(nativeEl);

        if (offsetParentEl !== window.document) {
            offsetParentBCR = this.offset(offsetParentEl);
            offsetParentBCR.top += offsetParentEl.clientTop - offsetParentEl.scrollTop;
            offsetParentBCR.left += offsetParentEl.clientLeft - offsetParentEl.scrollLeft;
        }

        const bounds = nativeEl.getBoundingClientRect();

        return {
            width: bounds.width || nativeEl.offsetWidth,
            height: bounds.height || nativeEl.offsetHeight,
            top: elBCR.top - offsetParentBCR.top,
            left: elBCR.left - offsetParentBCR.left
        };
    }

    private offset(element: any): { width: number, height: number, top: number, left: number } {
        const bounds = element.getBoundingClientRect();

        return {
            width: bounds.width || element.offsetWidth,
            height: bounds.height || element.offsetHeight,
            top: bounds.top + (window.pageYOffset || window.document.documentElement.scrollTop),
            left: bounds.left + (window.pageXOffset || window.document.documentElement.scrollLeft)
        };
    }

    private getStyle(element: HTMLElement, cssProp: string): string {
        if ((element as any).currentStyle) // IE
            return (element as any).currentStyle[cssProp];

        if (window.getComputedStyle)
            return (window.getComputedStyle(element) as any)[cssProp];

        // finally try and get inline style

        return (element.style as any)[cssProp];
    }

    private isStaticPositioned(nativeEl: HTMLElement): boolean {
        return (this.getStyle(nativeEl, "position") || "static" ) === "static";
    }

    private parentOffsetEl(nativeEl: HTMLElement): any {
        let offsetParent: any = nativeEl.offsetParent || window.document;

        while (offsetParent && offsetParent !== window.document && this.isStaticPositioned(offsetParent)) {
            offsetParent = offsetParent.offsetParent;
        }

        return offsetParent || window.document;
    }

}
@Injectable()
export class Overlays {
    // instance data

    private rootViewContainerRef: ViewContainerRef;

    // constructor

    constructor(private resolver: ComponentFactoryResolver, private applicationRef: ApplicationRef) {
    }

    // public

    public createOverlay<C extends Overlay>(host: HTMLElement, position : string, component : Type<C>, parameters : any = undefined) : ComponentRef<C> {
        let factory = this.resolver.resolveComponentFactory(component);

        let ref = this.getRootViewContainer().createComponent(factory);

        // pass data

        let instance = ref.instance;

        instance.placement = {
            host: host,
            position:  position
        };

        if (parameters) {
            for (let key in parameters)
                instance[key] = parameters[key];
        } // if

        // done

        return ref;
    }

    // private

    private getRootViewContainer() : ViewContainerRef {
        if (!this.rootViewContainerRef)
            this.rootViewContainerRef = this.applicationRef['_rootComponents'][0]['_hostElement'].vcRef;

        return this.rootViewContainerRef;
    }
}
