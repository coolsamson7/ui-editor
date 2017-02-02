

export class DownloadService {
    // public

    public downloadJSON(data : any, filename = undefined) : void {
        if (!filename)
            filename = 'download.json';

        if (typeof data === 'object')
            data = JSON.stringify(data, undefined, 2);

        let blob = new Blob([data], {type: 'text/json'});

        let mouseEvent = document.createEvent('MouseEvents');

        let a = document.createElement('a');

        a.download = filename;
        a.href = window.URL.createObjectURL(blob);

        mouseEvent.initEvent('click', true, true);

        a.dispatchEvent(mouseEvent);
    };
}