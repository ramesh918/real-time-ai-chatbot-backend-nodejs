'use strict';

var dbm;
var type;
var seed;

exports.setup = function (options, _seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = _seedLink;
};

exports.up = function (db) {
  return db.runSql(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

exports.down = function (db) {
  return db.runSql('DROP TABLE IF EXISTS users CASCADE');
};

exports._meta = {
  version: 1,
};
