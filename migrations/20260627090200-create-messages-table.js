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
    CREATE TABLE messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
    CREATE INDEX idx_messages_sender_id ON messages(sender_id);
    CREATE INDEX idx_messages_created_at ON messages(created_at);
  `);
};

exports.down = function (db) {
  return db.runSql('DROP TABLE IF EXISTS messages CASCADE');
};

exports._meta = {
  version: 1,
};
