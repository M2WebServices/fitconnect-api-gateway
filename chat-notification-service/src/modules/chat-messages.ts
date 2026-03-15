import { getPool } from "../database/postgres";

type ChatMessage = {
  id: string;
  content: string;
  senderId: string;
  groupId: string;
  createdAt: string;
};

const toIsoString = (value: Date | string): string => {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

export const getGroupMessages = async (groupId: string, limit: number): Promise<ChatMessage[]> => {
  const pool = getPool();
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 50;

  const result = await pool.query<{
    id: string;
    content: string;
    sender_id: string;
    group_id: string;
    created_at: Date | string;
  }>(
    `
    SELECT id, content, sender_id, group_id, created_at
    FROM chat_messages
    WHERE group_id = $1
    ORDER BY created_at DESC
    LIMIT $2
    `,
    [groupId, safeLimit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    content: row.content,
    senderId: row.sender_id,
    groupId: row.group_id,
    createdAt: toIsoString(row.created_at),
  }));
};

export const sendGroupMessage = async (payload: {
  groupId: string;
  content: string;
  senderId: string;
}): Promise<ChatMessage> => {
  const pool = getPool();
  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();

  const result = await pool.query<{
    id: string;
    content: string;
    sender_id: string;
    group_id: string;
    created_at: Date | string;
  }>(
    `
    INSERT INTO chat_messages (id, content, sender_id, group_id, created_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, content, sender_id, group_id, created_at
    `,
    [id, payload.content, payload.senderId, payload.groupId, createdAt]
  );

  const message = result.rows[0];
  return {
    id: message.id,
    content: message.content,
    senderId: message.sender_id,
    groupId: message.group_id,
    createdAt: toIsoString(message.created_at),
  };
};

export const deleteGroupMessage = async (messageId: string, userId: string): Promise<boolean> => {
  const pool = getPool();
  const result = await pool.query(
    `
    DELETE FROM chat_messages
    WHERE id = $1 AND sender_id = $2
    RETURNING id
    `,
    [messageId, userId]
  );

  return (result.rowCount ?? 0) > 0;
};
