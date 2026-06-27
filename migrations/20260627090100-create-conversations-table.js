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
    CREATE TABLE conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_conversations_user_id ON conversations(user_id);
  `);
};

exports.down = function (db) {
  return db.runSql('DROP TABLE IF EXISTS conversations CASCADE');
};

exports._meta = {
  version: 1,
};
