
export class UniqueArray<T> extends Array<T> {
    lookupMap: Map<string, number>;

    constructor(...args) {
        super(...args);
        this.lookupMap = new Map();
    }

    addAll(objects: [T]) {
        if (objects && objects.length) {
            objects.forEach(object => this.add(object));
        }
    }

    add(object: T) {
        let key = (object.uniqueKey) ? object.uniqueKey() : object.toString();
        let ndx = this.lookup(key);
        //
        if (ndx === undefined) {
            this.push(object);
            this.lookupMap.set(key, this.length-1);
        }
    }

    delete(object: T) {
        let key = (object.uniqueKey) ? object.uniqueKey() : object.toString();
        let ndx = this.lookup(key);
        //
        if (ndx !== undefined) {
            this.splice(ndx, 1);
        }
        this.lookupMap.delete(key);
    }

    lookup(key: string) {
        let ndx = this.lookupMap.get(key);
        return ndx;
    }
}

Array.prototype.add = UniqueArray.prototype.add;
Array.prototype.delete = UniqueArray.prototype.delete;
Array.prototype.lookup = UniqueArray.prototype.lookup;
