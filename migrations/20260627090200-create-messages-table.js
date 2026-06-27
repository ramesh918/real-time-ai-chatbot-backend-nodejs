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
  return db.createTable('messages', {
    id: { type: 'uuid', primaryKey: true, defaultValue: new String('gen_random_uuid()') },
    conversation_id: { type: 'uuid', notNull: true, foreignKey: { name: 'fk_messages_conversation_id', table: 'conversations', rules: { onDelete: 'CASCADE' } } },
    sender_id: { type: 'uuid', notNull: true, foreignKey: { name: 'fk_messages_sender_id', table: 'users', rules: { onDelete: 'CASCADE' } } },
    role: { type: 'string', length: 50, notNull: true }, // 'user' or 'assistant'
    content: { type: 'text', notNull: true },
    created_at: { type: 'datetime', defaultValue: new String('CURRENT_TIMESTAMP') },
  })
  .then(function() {
    return db.addIndex('messages', 'idx_messages_conversation_id', ['conversation_id']);
  })
  .then(function() {
    return db.addIndex('messages', 'idx_messages_sender_id', ['sender_id']);
  })
  .then(function() {
    return db.addIndex('messages', 'idx_messages_created_at', ['created_at']);
  });
};

exports.down = function (db) {
  return db.dropTable('messages');
};

exports._meta = {
  version: 1,
};
