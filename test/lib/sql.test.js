'use strict';

const { expect } = require('chai');
const sqlLib = require('../../lib/sql');

describe('[UTILS] SQL', () => {
  describe('#buildFindSql', () => {
    it('builds a simple find SQL', () => {
      const findSql = sqlLib.buildFindSql('test', {
        foo: 'bar',
        test: 'test',
      });
      expect(findSql).to.equal('SELECT * FROM test WHERE foo=? AND test=?');
    });

    it('builds a find SQL with selected fields projections', () => {
      const findSql = sqlLib.buildFindSql(
        'test',
        {
          foo: 'bar',
          test: 'test',
        },
        { projections: ['name', 'address', 'age'] },
      );
      expect(findSql).to.equal(
        'SELECT name,address,age FROM test WHERE foo=? AND test=?',
      );
    });

    it('builds a find SQL with fields projections and sorting', () => {
      const findSql = sqlLib.buildFindSql(
        'test',
        {
          foo: 'bar',
          test: 'test',
        },
        {
          projections: ['name', 'address', 'age'],
          sort: { name: 'ASC', age: 'DESC' },
        },
      );
      expect(findSql).to.equal(
        'SELECT name,address,age FROM test ' +
          'WHERE foo=? AND test=? ORDER BY name ASC,age DESC',
      );
    });

    it('builds a find SQL with projections, sorting and limit', () => {
      const findSql = sqlLib.buildFindSql(
        'test',
        {
          foo: 'bar',
          test: 'test',
        },
        {
          projections: ['name', 'address', 'age'],
          sort: { name: 'ASC', age: 'DESC' },
          limit: 5,
        },
      );
      expect(findSql).to.equal(
        'SELECT name,address,age FROM test ' +
          'WHERE foo=? AND test=? ORDER BY name ASC,age DESC LIMIT 5',
      );
    });

    it('builds a find SQL with projections, sorting, limit and offset', () => {
      const findSql = sqlLib.buildFindSql(
        'test',
        {
          foo: 'bar',
          test: 'test',
        },
        {
          projections: ['name', 'address', 'age'],
          sort: { name: 'ASC', age: 'DESC' },
          limit: 5,
          offset: 10,
        },
      );
      expect(findSql).to.equal(
        'SELECT name,address,age FROM test ' +
          'WHERE foo=? AND test=? ORDER BY name ASC,age DESC ' +
          'LIMIT 5 OFFSET 10',
      );
    });
  });

  describe('#buildInsertSql', () => {
    it('builds a simple insert SQL', () => {
      const insertSql = sqlLib.buildInsertSql('test', [
        'name',
        'age',
        'birthDate',
        'address',
      ]);
      expect(insertSql).to.equal(
        'INSERT INTO test (name,age,birthDate,address) VALUES (?,?,?,?)',
      );
    });

    it('builds a simple insert SQL for multiple rows', () => {
      const insertSql = sqlLib.buildInsertSql(
        'test',
        ['name', 'age', 'birthDate', 'address'],
        3,
      );
      expect(insertSql).to.equal(
        'INSERT INTO test (name,age,birthDate,address) ' +
          'VALUES (?,?,?,?),(?,?,?,?),(?,?,?,?)',
      );
    });
  });

  describe('#buildUpdateSql', () => {
    it('builds a simple update SQL', () => {
      const updateSql = sqlLib.buildUpdateSql('test', {}, { name: 'test' });
      expect(updateSql).to.equal('UPDATE test SET name=? WHERE 1');
    });

    it('builds an update SQL with matching criterias', () => {
      const updateSql = sqlLib.buildUpdateSql(
        'test',
        { name: 'john', age: 20 },
        { name: 'test' },
      );
      expect(updateSql).to.equal(
        'UPDATE test SET name=? WHERE name=? AND age=?',
      );
    });

    it('builds an update SQL with multiple updates and criterias', () => {
      const updateSql = sqlLib.buildUpdateSql(
        'test',
        { name: 'john', address: 'test' },
        { name: 'test', age: 30 },
      );
      expect(updateSql).to.equal(
        'UPDATE test SET name=?,age=? WHERE name=? AND address=?',
      );
    });

    it('builds an update SQL with sorting', () => {
      const updateSql = sqlLib.buildUpdateSql(
        'test',
        { name: 'john', address: 'test' },
        { name: 'test', age: 30 },
        { sort: { name: 'ASC', age: 'DESC' } },
      );
      expect(updateSql).to.equal(
        'UPDATE test SET name=?,age=? WHERE name=? AND address=? ' +
          'ORDER BY name ASC,age DESC',
      );
    });

    it('builds an update SQL with sorting and limit', () => {
      const updateSql = sqlLib.buildUpdateSql(
        'test',
        { name: 'john', address: 'test' },
        { name: 'test', age: 30 },
        { sort: { name: 'ASC', age: 'DESC' }, limit: 2 },
      );
      expect(updateSql).to.equal(
        'UPDATE test SET name=?,age=? WHERE name=? AND address=? ' +
          'ORDER BY name ASC,age DESC LIMIT 2',
      );
    });
  });
});
