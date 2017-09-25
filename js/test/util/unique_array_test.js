const UniqueArray = require('../../src/util/unique_array');

const chai = require('chai');
const assert = chai.assert;

class TestDuplicate {
    constructor(theId) {
        this.id = theId;
    }

    uniqueKey() {
        return `__${this.id}__`;
    }
    toString() {
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

  describe('#addAll', function() {
      it('should be able to add array ', function() {
          let arr = new UniqueArray();
          arr.addAll(['one', 'one', 'two', 'two']);
          assert.equal(2, arr.length);
          let list = new Array();
          list.push('three');
          list.push('three');
          arr.addAll(list);
          assert.equal(3, arr.length);
          arr.addAll(3);
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
        arr.delete('four');
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
        arr.delete(new TestDuplicate('one'));
        assert.equal(2, arr.length);
    });
  });

});
