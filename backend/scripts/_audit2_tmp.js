const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;

  const convs = await db.collection('conversations').find({}).toArray();
  const msgs = await db.collection('messages').find({}).sort({ createdAt: 1 }).toArray();
  const users = await db.collection('users').find({}).toArray();
  const userIds = new Set(users.map((u) => String(u._id)));

  console.log('=== CONVERSATIONS (' + convs.length + ') ===');
  for (const c of convs) {
    const parts = (c.participants || []).map((p) => String(p));
    const valid = parts.filter((p) => userIds.has(p));
    const invalid = parts.filter((p) => !userIds.has(p));
    console.log(JSON.stringify({
      _id: String(c._id),
      participants: parts,
      validParticipants: valid,
      invalidParticipants: invalid,
      lastMessage: c.lastMessage ? String(c.lastMessage) : null,
      lastMessageAt: c.lastMessageAt,
      archivedBy: (c.archivedBy || []).map((p) => String(p)),
    }));
  }

  console.log('\n=== MESSAGES (' + msgs.length + ') ===');
  for (const m of msgs) {
    const s = String(m.sender);
    const r = String(m.receiver);
    const senderValid = userIds.has(s);
    const receiverValid = userIds.has(r);
    console.log(JSON.stringify({
      _id: String(m._id),
      conversation: String(m.conversation),
      sender: s + (senderValid ? '' : ' [INVALID]'),
      receiver: r + (receiverValid ? '' : ' [INVALID]'),
      content: (m.content || '').slice(0, 60),
      type: m.type,
      createdAt: m.createdAt,
      isDeleted: m.isDeleted,
    }));
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => { console.error('ERROR', err); process.exit(1); });
