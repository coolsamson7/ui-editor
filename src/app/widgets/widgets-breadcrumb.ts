import {Component, Input, Output, EventEmitter, ChangeDetectionStrategy} from "@angular/core";


@Component({
    selector: 'xbread-crumb',
    //host: {
    //    'style': 'height: inherit; display: flex; flex-direction: column;'
    //},
    template: `
 <div class="breadcrumbs">
    <ul>
        <li *ngFor="let step of steps">
            <a (click)="clicked(step)">
               {{step.label}}
            </a>
        </li>
    </ul>
</div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Breadcrumb {
    // input

    @Input()
    steps : any = [];
    @Output()
    onClick = new EventEmitter();

    // callbacks

    clicked(step : any) {
        this.onClick.emit(step);
    }
}
