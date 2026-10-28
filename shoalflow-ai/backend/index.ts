import { router, json, error, requireAuth, db, ai } from '@appdeploy/sdk';
type BusinessRecord = {
  ownerId: string;
  kind: string;
  name: string;
  detail: string;
  amount: number;
  status: string;
  createdAt: string;
};
const kinds = ['customers', 'quotes', 'invoices', 'followups'];
function parse(body: unknown) {
  const b = (body || {}) as Record<string, unknown>;
  const kind = String(b.kind || '');
  const name = String(b.name || '').trim();
  const detail = String(b.detail || '').trim();
  const amount = Number(b.amount || 0);
  const status = String(b.status || 'Draft');
  if (
    !kinds.includes(kind) ||
    !name ||
    name.length > 120 ||
    detail.length > 1500 ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > 100000000000 ||
    status.length > 40
  )
    return null;
  return { kind, name, detail, amount, status };
}
export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'OK' })],
  'GET /api/records': [
    requireAuth(),
    async ctx => {
      const own = ctx.user!.userId;
      const result = await db.list<BusinessRecord>('business_records', {
        limit: 500,
        filter: { ownerId: own },
      });
      return json({
        items: result.items.filter(item => item.ownerId === own),
        more: !!result.nextToken,
      });
    },
  ],
  'POST /api/records': [
    requireAuth(),
    async ctx => {
      const b = parse(ctx.body);
      if (!b)
        return error('Valid name, type, status and amount required.', 400);
      const [id] = await db.add('business_records', [
        {
          ...b,
          ownerId: ctx.user!.userId,
          createdAt: new Date().toISOString(),
        },
      ]);
      if (!id) return error('Unable to create record', 409);
      return json({ id }, 201);
    },
  ],
  'PUT /api/records/:id': [
    requireAuth(),
    async ctx => {
      const b = parse(ctx.body);
      if (!b) return error('Invalid record', 400);
      const [old] = await db.get<BusinessRecord>(
        'business_records',
        [ctx.params.id],
        { consistent: true }
      );
      if (!old || old.ownerId !== ctx.user!.userId)
        return error('Not found', 404);
      const [ok] = await db.tx.update(
        'business_records',
        [{ id: ctx.params.id, record: b, if: { ownerId: ctx.user!.userId } }],
        { patch: true }
      );
      return ok ? json({ ok: true }) : error('Update conflict', 409);
    },
  ],
  'DELETE /api/records/:id': [
    requireAuth(),
    async ctx => {
      const [old] = await db.get<BusinessRecord>(
        'business_records',
        [ctx.params.id],
        { consistent: true }
      );
      if (!old || old.ownerId !== ctx.user!.userId)
        return error('Not found', 404);
      const [ok] = await db.tx.update(
        'business_records',
        [
          {
            id: ctx.params.id,
            record: { archived: true },
            if: { ownerId: ctx.user!.userId },
          },
        ],
        { patch: true }
      );
      if (!ok) return error('Delete conflict', 409);
      const [done] = await db.delete('business_records', [ctx.params.id]);
      return done ? json({ ok: true }) : error('Deletion not completed', 409);
    },
  ],
  'POST /api/draft': [
    requireAuth(),
    async ctx => {
      const b = (ctx.body || {}) as { prompt?: unknown; kind?: unknown };
      const prompt = String(b.prompt || '').trim();
      if (!prompt || prompt.length > 1200)
        return error('Instructions required, maximum 1200 characters.', 400);
      const result = await ai.generate({
        system:
          'You are ShoalFlow AI, an assistant to a Kenyan small business. Produce clear concise professional quotation introductions or customer follow-ups. Never invent prices, bank details, dates, client names, payment status, or factual claims. Label placeholders for missing information. All content is a draft requiring human approval.',
        prompt:
          'Context: ' + String(b.kind || 'business') + '; request: ' + prompt,
        maxTokens: 500,
        thinkingMode: 'FAST',
      });
      return json({ text: result.text });
    },
  ],
});
