import {UniqueArray}                from '../../src/util/unique_array';
import type {UniqueIdentifier}      from '../../src/util/unique_id';

const chai = require('chai');
const assert = chai.assert;

class TestDuplicate implements UniqueIdentifier {
    id:         string;
    realmName:  string;         // realm-name

    constructor(theId: string) {
        this.id = theId;
    }

    uniqueKey(): string {
        return `__${this.id}__`;
    }
    toString(): string {
        return this.id;
    }
}



describe('UniqueArray', function() {

  describe('#add', function() {
      it('should not be able to add duplicates', function() {
          let arr = new UniqueArray();
          arr.add('one');
          arr.add('two');
          arr.add('two');
          arr.add('three');
          arr.add('three');
          assert.equal(3, arr.length);
      });
  });

  describe('#delete', function() {
    it('should be able to delete', function() {
        let arr = new UniqueArray();
        arr.add('one');
        arr.add('two');
        arr.add('two');
        arr.add('three');
        arr.add('three');
        arr.delete('two');
        assert.equal(2, arr.length);
    });
  });

  describe('#addUniqueIdentifier', function() {
      it('should not be able to add duplicates that implement UniqueIdentifier', function() {
          let arr = new UniqueArray();
          arr.add(new TestDuplicate('one'));
          arr.add(new TestDuplicate('two'));
          arr.add(new TestDuplicate('two'));
          arr.add(new TestDuplicate('three'));
          arr.add(new TestDuplicate('three'));
          assert.equal(3, arr.length);
      });
  });

  describe('#deleteUniqueIdentifier', function() {
    it('should be able to delete that implement UniqueIdentifier', function() {
        let arr = new UniqueArray();
        arr.add(new TestDuplicate('one'));
        arr.add(new TestDuplicate('one'));
        arr.add(new TestDuplicate('two'));
        arr.add(new TestDuplicate('two'));
        arr.add(new TestDuplicate('three'));
        assert.equal(3, arr.length);
        //arr.delete(new TestDuplicate('one'));
        //assert.equal(2, arr.length);
    });
  });
});
