class UniqueArray extends Array {
    constructor(...args) {
        super(...args);
    }

    table() {
        this.lookupMap = this.lookupMap || new Map();
        return this.lookupMap;
    }

    addAll(objects) {
        if (objects.constructor == Array) {
            objects.forEach(object => this.add(object));
        }
    }

    add(object) {
        let key = (object.uniqueKey) ? object.uniqueKey() : object.toString();
        //
        if (!this.exists(object)) {
            this.push(object);
            this.table().set(key, this.length-1);
        }
    }

    delete(object) {
        let key = (object.uniqueKey) ? object.uniqueKey() : object.toString();
        let ndx = this.table().get(key);
        //
        if (ndx !== undefined) {
            this.splice(ndx, 1);
        }
        this.table().delete(key);
    }

    exists(object) {
        let key = (object.uniqueKey) ? object.uniqueKey() : object.toString();
        let ndx = this.table().get(key);
        return (ndx !== undefined);
    }
}

Array.prototype.add = UniqueArray.prototype.add;
Array.prototype.delete = UniqueArray.prototype.delete;
Array.prototype.exists = UniqueArray.prototype.exists;
Array.prototype.table = UniqueArray.prototype.table;
module.exports = UniqueArray;
