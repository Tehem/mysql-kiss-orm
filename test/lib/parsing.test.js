'use strict';

const { expect } = require('chai');
const parsingLib = require('../../lib/parsing');

describe('[UTILS] parsing', () => {
  describe('#getFieldsList', () => {
    it('returns * if field list is null', () => {
      const fieldList = parsingLib.getFieldsList(null);
      expect(fieldList).to.equal('*');
    });

    it('returns * if field list is empty', () => {
      const fieldList = parsingLib.getFieldsList([]);
      expect(fieldList).to.equal('*');
    });

    it('returns a simple field name if field list contains only one field', () => {
      const fieldList = parsingLib.getFieldsList(['test']);
      expect(fieldList).to.equal('test');
    });

    it('returns a list of field separated by commas if field list contains multiple fields', () => {
      const fieldList = parsingLib.getFieldsList(['test', 'coffee', 'latte']);
      expect(fieldList).to.equal('test,coffee,latte');
    });
  });

  describe('#getQueryPart', () => {
    it('returns 1 if query is null', () => {
      const queryPart = parsingLib.getQueryPart(null);
      expect(queryPart).to.equal('1');
    });

    it('returns 1 if query is empty', () => {
      const queryPart = parsingLib.getQueryPart({});
      expect(queryPart).to.equal('1');
    });

    it('returns one field with a placeholder part if only one key', () => {
      const queryPart = parsingLib.getQueryPart({ joe: 'mocha' });
      expect(queryPart).to.equal('joe=?');
    });

    it('returns multiple field with placeholders part if multiple keys', () => {
      const queryPart = parsingLib.getQueryPart({
        joe: 'mocha',
        jake: 'latte',
        john: 'Cappuccino',
      });
      expect(queryPart).to.equal('joe=? AND jake=? AND john=?');
    });
  });

  describe('#getSortingPart', () => {
    it('returns empty string if sort is null', () => {
      const sortingPart = parsingLib.getSortingPart(null);
      expect(sortingPart).to.equal('');
    });
    it('returns empty string if sort is empty', () => {
      const sortingPart = parsingLib.getSortingPart({});
      expect(sortingPart).to.equal('');
    });
    it('returns empty string if sort is in the end invalid', () => {
      const sortingPart = parsingLib.getSortingPart({ 0: null });
      expect(sortingPart).to.equal('');
    });
    it('returns ORDER BY string with sort direction regardless of case', () => {
      const sortingPart = parsingLib.getSortingPart({
        id: 'asc',
        name: 'DESc',
      });
      expect(sortingPart).to.equal('ORDER BY id ASC,name DESC');
    });
  });

  describe('#getInsertFieldsPart', () => {
    it('return object keys if only one item', () => {
      const fields = parsingLib.getCommonFields([
        { id: 2, surname: 'mocha', type: 1 },
      ]);
      expect(fields).to.deep.equal(['id', 'surname', 'type']);
    });
    it('returns array of common fields #1', () => {
      const fields = parsingLib.getCommonFields([
        { id: 1, name: 'test name', value: 243 },
        { id: 2, name: 'test name 2', value: 4, type: 23 },
        { id: 3, name: 'test name 3', type: 2 },
        { id: 4, name: 'test name 3', value: 343, type: 2, reason: 'test' },
      ]);
      expect(fields).to.deep.equal(['id', 'name']);
    });
    it('returns array of common fields #2', () => {
      const fields = parsingLib.getCommonFields([
        { id: 1, name: 'test name', value: 243, gender: 'male' },
        {
          id: 2,
          surname: 'Test2',
          name: 'test name 2',
          value: 4,
          gender: 'male',
          type: 23,
        },
        { id: 3, gender: 'female', name: 'test name 3', type: 2 },
        {
          id: 4,
          name: 'test name 3',
          surname: 'Test4',
          type: 2,
          reason: 'test',
          gender: 'female',
        },
      ]);
      expect(fields).to.deep.equal(['gender', 'id', 'name']);
    });
  });

  describe('#sortObjectByKeys', () => {
    it('returns an object sorted by its keys', () => {
      const ordered = parsingLib.sortObjectByKeys({
        id: 2,
        surname: 'mocha',
        type: 1,
        name: 'Joe Mocha',
        address: '4 philip street',
        gender: 'male',
      });
      expect(ordered).to.deep.equal({
        address: '4 philip street',
        gender: 'male',
        id: 2,
        name: 'Joe Mocha',
        surname: 'mocha',
        type: 1,
      });
    });
  });

  describe('#getInsertValues', () => {
    it('returns an array of merged placeholders values', () => {
      const values = parsingLib.getInsertValues([
        {
          id: 1,
          surname: 'cappuccino',
          address: '23 mayflower street',
          name: 'Jane Cappuccino',
        },
        {
          id: 2,
          surname: 'mocha',
          name: 'Joe Mocha',
          address: '4 philip street',
        },
      ]);
      expect(values).to.deep.equal([
        '23 mayflower street',
        1,
        'Jane Cappuccino',
        'cappuccino',
        '4 philip street',
        2,
        'Joe Mocha',
        'mocha',
      ]);
    });
  });
});
