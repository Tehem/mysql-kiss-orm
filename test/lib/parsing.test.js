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
      expect(sortingPart).to.equal('ORDER BY id ASC, name DESC');
    });
  });
});
