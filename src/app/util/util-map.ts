export class HashMap<K,V> {
    // class methods

    public static objectHash(value : any) : number {
        return 1; // TODO
    }

    public static stringHash(value : string) : number {
        var string = value.toString(), hash = 0, i;
        for (i = 0; i < string.length; i++) {
            hash = (((hash << 5) - hash) + string.charCodeAt(i));
            hash = hash & hash; // Convert to 32bit integer
        }

        return Math.abs(hash);
    }

    // instance data

    private buckets : any[];
    private equals : (v1 : K, v2 : K) => boolean;
    private hash : (K) => number;
    private loadFactor : number;
    private capacity : number = 16;
    private threshold : number;
    private entries : number;

    // constructor

    constructor(hash? : (K) => number, equals? : (v1 : K, v2 : K) => boolean, capacity? : number, loadFactor? : number) {
        this.capacity = capacity ? capacity : 16; // power of 2
        this.loadFactor = loadFactor ? loadFactor : 0.75;
        this.equals = equals ? equals : function (a, b) {
            return a === b;
        };
        this.hash = hash ? hash : function (value) {
            return 1;
        };

        // internal stuff

        this.buckets = new Array(this.capacity);
        this.threshold = this.capacity * this.loadFactor;
        this.entries = 0;
    }

    // public

    put(key : K, value : V) {
        if (this.entries >= this.threshold) {
            // resize

            var newCapacity = this.capacity * 2 + 1;
            var newBuckets = new Array(newCapacity);

            // copy

            for (var i = 0; i < this.capacity; i++)
                if (this.buckets[i]) {
                    var oldBucket = this.buckets[i];

                    for (var j = 0; j < oldBucket.length; ++j) {
                        var entry = oldBucket[j];

                        var hash = this.hash(entry.key) % newCapacity;
                        var newBucket = newBuckets[hash];

                        if (!newBucket) {
                            newBucket = [];
                            newBuckets[hash] = newBucket;
                        }

                        newBucket.push(entry);
                    } // for
                } // if

            // done

            this.buckets = newBuckets;
            this.capacity = newCapacity;
            this.threshold = this.capacity * this.loadFactor;
        } // if

        var hashCode = this.hash(key) % this.capacity;
        var bucket = this.buckets[hashCode];

        if (!bucket) {
            bucket = [];
            this.buckets[hashCode] = bucket;
        }

        for (var i = 0; i < bucket.length; ++i)
            if (this.equals(bucket[i].key, key)) {
                bucket[i].value = value;
                return;
            }

        bucket.push({key: key, value: value});

        this.entries++;
    }

    get(key : K) : V {
        var hashCode = this.hash(key) % this.capacity;
        var bucket = this.buckets[hashCode];

        if (!bucket)
            return undefined;

        for (var i = 0; i < bucket.length; ++i)
            if (this.equals(bucket[i].key, key))
                return bucket[i].value;

        return undefined;
    }

    keys() : V[] {
        var keys = [];
        for (var i = 0; i < this.capacity; i++)
            if (this.buckets[i]) {
                var bucket = this.buckets[i];

                for (var j = 0; j < bucket.length; ++j)
                    keys.push(bucket[j].key);
            } // if

        return keys;
    }

    values() : V[] {
        var values = [];
        for (var i = 0; i < this.capacity; i++)
            if (this.buckets[i]) {
                var bucket = this.buckets[i];

                for (var j = 0; j < bucket.length; ++j)
                    values.push(bucket[j].value);
            } // if

        return values;
    }
}
