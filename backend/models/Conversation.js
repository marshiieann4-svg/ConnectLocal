const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  participantsKey: {
    type: String
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    default: null
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Unique conversation per participant pair (order-independent).
conversationSchema.index({ participantsKey: 1 }, { unique: true, sparse: true });

conversationSchema.pre('validate', function setParticipantsKey() {
  if (!Array.isArray(this.participants) || this.participants.length < 2) {
    this.participantsKey = undefined;
    return;
  }

  const sortedParticipantIds = this.participants
    .map((participantId) => participantId.toString())
    .sort();

  this.participantsKey = sortedParticipantIds.join(':');
});

conversationSchema.statics.ensureConversationIndexes = async function ensureConversationIndexes() {
  const collection = this.collection;
  const existingIndexes = await collection.indexes();

  const hasLegacyParticipantsIndex = existingIndexes.some((index) => index.name === 'participants_1' && index.unique);
  if (hasLegacyParticipantsIndex) {
    await collection.dropIndex('participants_1');
  }

  const participantsKeyIndex = existingIndexes.find((index) => index.name === 'participantsKey_1');
  if (participantsKeyIndex && !participantsKeyIndex.unique) {
    await collection.dropIndex('participantsKey_1');
  }

  await collection.createIndex({ participantsKey: 1 }, { unique: true, sparse: true, name: 'participantsKey_1' });

  const missingKeyDocs = await this.find({
    participants: { $exists: true, $type: 'array' },
    $or: [
      { participantsKey: { $exists: false } },
      { participantsKey: null },
      { participantsKey: '' }
    ]
  }).select('_id participants').lean();

  if (missingKeyDocs.length) {
    const operations = missingKeyDocs
      .filter((doc) => Array.isArray(doc.participants) && doc.participants.length >= 2)
      .map((doc) => {
        const key = doc.participants.map((id) => id.toString()).sort().join(':');
        return {
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { participantsKey: key } }
          }
        };
      });

    if (operations.length) {
      await collection.bulkWrite(operations, { ordered: false });
    }
  }
};

module.exports = mongoose.model('Conversation', conversationSchema);