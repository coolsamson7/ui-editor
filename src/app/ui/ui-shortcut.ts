import {Injectable, HostListener} from "@angular/core";

@Injectable()
export class Shortcut {
    // instance data

    private shortcuts = [[]]; // array of arrays
    private charKeyCodes = {
        'delete': 8,
        'tab': 9,
        'enter': 13,
        'return': 13,
        'esc': 27,
        'space': 32,
        'left': 37,
        'up': 38,
        'right': 39,
        'down': 40,
        ';': 186,
        '=': 187,
        ',': 188,
        '-': 189,
        '.': 190,
        '/': 191,
        '`': 192,
        '[': 219,
        '\\': 220,
        ']': 221,
        "'": 222,
        'f1':112,
        'f2':113,
        'f3':114,
        'f4':115,
        'f5':116,
        'f6':117,
        'f7':118,
        'f8':119,
        'f9':120,
        'f10':121,
        'f11':122,
        'f12':123
    };
    private keyCodeChars = {};
    private modifierKeys = {
        'shift': 'shift',
        'ctrl': 'ctrl',
        'meta': 'meta',
        'alt': 'alt'
    };

    // helper functions

    private overwriteWithout(arr, item) {
        for (let i = arr.length; i >= 0; i--)
            if (arr[i] === item)
                arr.splice(i, 1);
    }

    private parseKeySet (shortCut) {
        let names = shortCut.split('+');
        let keys: any = {};

        // Default modifiers to unset.

        for (let name of Object.keys(this.modifierKeys)) {
            keys[name] = false;
        }

        for (let name of names) {
            let modifierKey = this.modifierKeys[name];
            if (modifierKey)
                keys[modifierKey] = true;

            else {
                //TODO ? if (name.indexOf('key:') >= 0)
                //    keys.keyCode = parseInt(name.replace('key:', ''));
                //else
                if (name.indexOf('key:') >= 0)
                    keys.keyCode = parseInt(name.replace('key:', ''));
                else
                    keys.keyCode = this.charKeyCodes[name];

                // In case someone tries for a weird key.

                if (!keys.keyCode)
                    return;
            }
        }

        return keys;
    }

    private parseEvent(e) {
        return {
            keyCode: e.which,//WTF charKeyCodes[keyCodeChars[e.which]],
            meta: e.metaKey || false,
            alt: e.altKey || false,
            ctrl: e.ctrlKey || false,
            shift: e.shiftKey || false
        };
    };

    private match(k1, k2) {
        return k1.keyCode === k2.keyCode &&
            k1.ctrl === k2.ctrl &&
            k1.alt === k2.alt &&
            k1.meta === k2.meta &&
            k1.shift === k2.shift;
    };

    public register(shortcut) {
        if (shortcut.shortCut.indexOf('|') > 0) {
            let shortcutKey = shortcut.shortCut.split('|');
            let thisShortCut;

            for (let i in shortcutKey) {
                thisShortCut.shortCut = shortcutKey[i];

                this.register(thisShortCut);
            }
        }
        else {
            shortcut.keys = this.parseKeySet(shortcut.shortCut);

            if (!shortcut.keys)
                return undefined;  // be kind...

            // append shortcut to highest layer

            this.shortcuts[this.shortcuts.length - 1].push(shortcut);

            return () => {this.unregister(shortcut);};
        }
    }

    public unregister(shortcut) {
        this.overwriteWithout(this.shortcuts[this.shortcuts.length - 1], shortcut);
    }

    public addLayer () {
        this.shortcuts.push([]);
    }

    public removeLayer () {
        this.shortcuts.splice(this.shortcuts.length - 1, 1);
    }

    // constructor

    constructor() {
        let i = 0;
        for (let character of '1234567890')
            this.charKeyCodes[character] = 49 + i++;

        i = 0;
        for (let character of 'abcdefghijklmnopqrstuvwxyz')
            this.charKeyCodes[character] = 65 + i++;

        // and characters

        for (let keyCode of Object.keys(this.charKeyCodes)) {
            this.keyCodeChars[keyCode] = this.charKeyCodes[keyCode];
        } // for
    }

    // public

    public handle(e) {
        // parse

        const eventKeys = this.parseEvent(e);

        if (e.target.tagName == "INPUT" || e.target.tagName == "TEXTAREA")
           return;  // Don't catch keys that were in inputs. Hmmm....

        //console.log(eventKeys);

        // check registered shortcuts

        if (this.shortcuts.length > 0)
            for (let i = this.shortcuts[this.shortcuts.length - 1].length - 1; i >= 0; i--) {
                const shortcut = this.shortcuts[this.shortcuts.length - 1][i];

                if (this.match(eventKeys, shortcut.keys) && this.handles(shortcut, e)) {
                    e.preventDefault();

                    if (shortcut.action)
                        shortcut.action();
                    else if (shortcut.run)
                        shortcut.run();

                    return;
                } // if
            } // for
    }

    // listener

    @HostListener('window:keydown', ['$event'])
    handleKeyDown($event) {
        this.handle(event);
    }

    // private

    private handles(shortcut: any, event: any) : boolean {
        return shortcut.handles ? shortcut.handles(event) : true;
    }
}