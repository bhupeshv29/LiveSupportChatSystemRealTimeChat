CREATE UNIQUE INDEX "one_open_conversation_per_candidate"
ON "Conversation" ("candidateId")
WHERE status = 'OPEN';
