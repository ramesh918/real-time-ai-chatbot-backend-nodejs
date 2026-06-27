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
  return db.createTable('conversations', {
    id: { type: 'uuid', primaryKey: true, defaultValue: new String('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, foreignKey: { name: 'fk_conversations_user_id', table: 'users', rules: { onDelete: 'CASCADE' } } },
    name: { type: 'string', length: 255, notNull: true },
    created_at: { type: 'datetime', defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'datetime', defaultValue: new String('CURRENT_TIMESTAMP') },
  })
  .then(function() {
    return db.addIndex('conversations', 'idx_conversations_user_id', ['user_id']);
  });
};

exports.down = function (db) {
  return db.dropTable('conversations');
};

exports._meta = {
  version: 1,
};
