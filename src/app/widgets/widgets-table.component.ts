import {Component, Directive, Input, Output, EventEmitter, HostListener, Injectable} from "@angular/core";

// Renderer

class Renderer {
    render (column : any, value : any) : string {
        return value.toString(); // default
    }
}

class StringRenderer extends Renderer {
    render (column : any, value : any) : string {
        return value;
    }
}

class NumberRenderer extends Renderer {
    render (column : any, value : any) : string {
        return value.toString();
    }
}

class BooleanRenderer extends Renderer {
    render (column : any, value : any) : string {
        return '<input type="checkbox" disabled="disabled" ' + (value ? 'checked="checked"' : '') + '/>';
    }
}

// Comparators

// TableModel


export class TableModel {
    // instance data

    private sortable : boolean = false;

    // public

    getNRows() : number {
        return 0;
    }

    getData(row : number, col : number) : any {
        return undefined;
    }

    isSortable() : boolean {
        return this.sortable;
    }

    setSortable(sortable : boolean) : TableModel {
        this.sortable = true;

        return this;
    }

    sortByColumn(index: number, sort : (v1 : any, v2 : any)=>number) : TableModel {
        return this;
    }
}

export class TupleTableModel extends TableModel {
    // instance data

    private data : any[][];

    // constructor

    constructor(data : any[][]) {
        super();

        this.data = data;
    }

    // override

    getData(row : number, col : number) : any {
        return this.data[row][col];
    }

    getNRows() : number {
        return this.data.length;
    }

    sortByColumn(column: number, sort : (v1 : any, v2 : any)=>number) : TableModel {
        this.data = this.data.sort((row1 : any[], row2 : any[]) => sort(row1[column], row2[column]));

        return this;
    }
}

export class PagedTableModel extends TableModel {
    // instance data

    private pageSize : number;
    private currentPage: number = 0;
    private tableModel : TableModel;
    private rows : number;
    private totalRows : number;
    private startRow : number;

    // constructor

    constructor(tableModel : TableModel, pageSize : number) {
        super();

        this.tableModel = tableModel;
        this.pageSize = pageSize;

        this.setPage(0);
    }

    // public

    public setPage(page : number) : void {
        this.currentPage = page;

        // compute number of rows

        this.totalRows = this.tableModel.getNRows();
        this.startRow = this.currentPage * this.pageSize;
        this.rows = this.startRow + this.pageSize > this.totalRows ?
            this.totalRows - this.startRow :
            this.pageSize;
    }

    // override

    isSortable() : boolean {
        return this.tableModel.isSortable();
    }


    sortByColumn(index: number, sort : (v1 : any, v2 : any)=>number) : TableModel {
        this.tableModel.sortByColumn(index, sort);

        return this;
    }

    setSortable(sortable : boolean) : TableModel {
        this.tableModel.setSortable(sortable);

        return this;
    }

    getNRows() : number {
        return this.rows;
    }

    getData(row : number, col : number) : any {
        return this.tableModel.getData(this.startRow + row, col);
    }
}

@Injectable()
export class ComparatorFactory {
    // instance data

    private registry : Map<string,(v1 : any, v2 : any)=>number> = new Map<string,(v1 : any, v2 : any)=>number>();

    // constructor

    constructor() {
        this
            .register("string",  this.compareObjects)
            .register("number",  this.compareObjects)
            .register("boolean", this.compareBooleans)
    }

    // private

    private compareBooleans(v1 : any, v2 : any) : number {
        if (v1 === v2)
            return 0;
        else if (v1)
            return 1;
        else
            return -1;
    }

    private compareObjects(v1 : any, v2 : any) : number {
        if (v1 === v2)
            return 0;
        else if (v1 > v2)
            return 1;
        else
            return -1;
    }

    // public

    public register(type : string, comparator : (v1 : any, v2 : any)=>number) : ComparatorFactory {
        this.registry.set(type, comparator);

        return this;
    }

    public getComparator(type : string, sort : string /*asc desc*/) : (v1 : any, v2 : any)=>number {
        let comparator = this.registry.get(type);
        if (sort == "desc")
            return (v1 : any, v2 : any) => -comparator(v1, v2);
        else
            return comparator;
    }
}

@Injectable()
export class RenderFactory {
    // instance data

    private registry : Map<string,Renderer> = new Map<string,Renderer>();

    // constructor

    constructor() {
        this
            .register("string",  new StringRenderer())
            .register("number",  new NumberRenderer())
            .register("boolean", new BooleanRenderer())
    }

    // public

    public register(type : string, renderer : Renderer) : RenderFactory {
        this.registry.set(type, renderer);

        return this;
    }

    public getRenderer(type) : Renderer {
        return this.registry.get(type);
    }
}

@Directive({selector: '[ngTableSorting]'})
export class NgTableSortingDirective {
    // input

    @Input() public ngTableSorting:any;
    @Input() public column:any;

    // output

    @Output() public sortChanged:EventEmitter<any> = new EventEmitter();

    @Input()
    public get config():any {
        return this.ngTableSorting;
    }

    public set config(value:any) {
        this.ngTableSorting = value;
    }

    @HostListener('click', ['$event', '$target'])
    public onToggleSort(event:any):void {
        if (event) {
            event.preventDefault();
        }

        if (this.ngTableSorting && this.column && this.column.sort !== false) {
            switch (this.column.sort) {
                case 'asc':
                    this.column.sort = 'desc';
                    break;
                case 'desc':
                    this.column.sort = 'asc';
                    break;
                default:
                    this.column.sort = 'asc';
                    break;
            }

            this.sortChanged.emit(this.column);
        }
    }
}

@Component({
    selector: 'ng-table',
    template: `
    <table class="table table-striped table-bordered dataTable"
           role="grid" style="width: 100%; margin-bottom: 0px">
      <thead>
      <tr role="row">
        <th *ngFor="let column of columns" [ngTableSorting]="_tableModel.isSortable()" [column]="column" (sortChanged)="onSortChanged($event)">
          {{column.name}}
          <i *ngIf="column.sort" class="pull-right glyphicon"
            [ngClass]="{'glyphicon-chevron-down': column.sort === 'desc', 'glyphicon-chevron-up': column.sort === 'asc'}"></i>
        </th>
      </tr>
      </thead>
      <tbody>
    
      <tr *ngFor="let row of rowIndices" (click)="onSelectRow($event, row)" (dblclick)="onActivateRow($event, row)">
        <td *ngFor="let column of columns; let c = index">{{render(row, c)}}</td>
      </tr>
      </tbody>
    </table>
    {{currentPage}}
    <ngb-pagination *ngIf="pageTableModel" [pageSize]="pageTableModel.pageSize" [collectionSize]="pageTableModel.totalRows" (pageChange)="newPage($event)"></ngb-pagination>
`,
})
export class NgTableComponent {
    // instance data

    private _tableModel : TableModel;
    private rowIndices : number[];
    private renderer : Renderer[];
    private pageTableModel : PagedTableModel;
    @Input() public set tableModel(model : TableModel) {
        this._tableModel = model;
        if (model instanceof PagedTableModel)
            this.pageTableModel = <PagedTableModel>model;

        this.rowIndices = new Array(model.getNRows()).fill(0).map((x,i)=>i);
    }

    // input

    @Input() public config:any = {};
    @Input()
    public set columns(columns: any[]) {
        this._columns = columns;

       // prepare renderer

        this.renderer = columns.map(column => this.renderFactory.getRenderer(column.type));
    }

    // output

    @Output() public tableChanged : EventEmitter<any> = new EventEmitter();
    @Output() public onSelect : EventEmitter<any> = new EventEmitter();
    @Output() public onActivate : EventEmitter<any> = new EventEmitter();

    private _columns : any[] = [];
    private currentPage = 0;

    // constructor

    constructor(private renderFactory : RenderFactory, private comparatorFactory : ComparatorFactory) {
    }

    // public

    public get columns(): any[] {
        return this._columns;
    }

    public get configColumns() : any {
        let sortColumns:Array<any> = [];

        this.columns.forEach((column:any) => {
            if (column.sort) {
                sortColumns.push(column);
            }
        });

        return {columns: sortColumns};
    }

    // sort callback...

    onSelectRow(event, row) {
        this.onSelect.emit(row);
    }

    onActivateRow(event, row) {
        this.onActivate.emit(row);
    }

    public newPage(page : number) {
        this.currentPage = page;

        this.pageTableModel.setPage(this.currentPage - 1);

        this.rowIndices = new Array(this.pageTableModel.getNRows()).fill(0).map((x,i)=>i);
    }

    public onSortChanged(column:any) : void {
        // remove from other columns

        let index = 0;

        this._columns.forEach((col:any, i) => {
            if (col.name !== column.name) {
                col.sort = '';
            }
            else index = i;
        });

        // trigger sorting

        let comparator = this.comparatorFactory.getComparator(column.type, column.sort);
        this._tableModel.sortByColumn(index, comparator); // asc / desc

        //this.tableChanged.emit({sorting: this.configColumns});
    }

    public render(row: number, col : number) : string {
        let data = this._tableModel.getData(row, col);

        return this.renderer[col].render(this.columns[col], data);
    }
}