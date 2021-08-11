export interface DragSource {
    create() : any;
}

export interface DropTarget {
    dropAllowed(object) : boolean;
    dropped(object : any) : any;
}
