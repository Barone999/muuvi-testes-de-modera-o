import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Contrato estático da proposta de moderação (não executável nesta etapa).
// Estes testes leem o SQL como texto; não comprovam RLS em um PostgreSQL real.
const sql = readFileSync(
  resolve(process.cwd(), "docs/proposals/20261112_community_moderation_admin_inheritance.proposal.sql"),
  "utf8",
);
// Ignora comentários para que as asserções olhem só para o SQL efetivo.
const code = sql.replace(/--.*$/gm, "");

const block = (pattern: RegExp) => code.match(pattern)?.[0] ?? "";
const moderateRpc = block(/create or replace function public\.moderate_community_post\([\s\S]*?\n\$\$;/i);
const setModeratorRpc = block(/create or replace function public\.set_community_moderator\([\s\S]*?\n\$\$;/i);
const staffFn = block(/create or replace function public\.is_community_staff\([\s\S]*?\$\$;/i);
const commentInsert = block(/create policy "own comment ins"[\s\S]*?\);\s*\n/i);
const likeInsert = block(/create policy "own like ins"[\s\S]*?\);\s*\n/i);
const rosterPolicy = block(/create policy "admins can read moderator roster"[\s\S]*?\);/i);

describe("proposta de moderação — contrato de segurança", () => {
  it("não depende de GUC: sem set_config, current_setting nem trigger de contexto", () => {
    expect(code).not.toMatch(/set_config\s*\(/i);
    expect(code).not.toMatch(/current_setting\s*\(/i);
    expect(code).not.toMatch(/muuvi\.moderation/i);
    expect(code).not.toMatch(/enforce_community_moderation_fields/i);
  });

  it("administradora herda a moderação automaticamente", () => {
    expect(staffFn).toMatch(/community_moderators/i);
    expect(staffFn).toMatch(/community_admins/i);
    expect(staffFn).toMatch(/security definer/i);
    expect(staffFn).toMatch(/set search_path = public/i);
    expect(moderateRpc).toMatch(/not public\.is_community_staff\(auth\.uid\(\)\)/i);
    for (const name of ["read posts", "read comments", "read likes", "moderators can read reports", "moderators can read moderation history"]) {
      const policy = block(new RegExp(`create policy "${name}"[\\s\\S]*?;`, "i"));
      expect(policy, name).toMatch(/public\.is_community_staff\(auth\.uid\(\)\)/i);
    }
  });

  it("nenhuma verificação de moderação considera só community_moderators", () => {
    expect(code).not.toMatch(/community_moderators m where m\.user_id = auth\.uid\(\)/i);
  });

  it("gestão da equipe é exclusiva de administradoras", () => {
    expect(setModeratorRpc).toMatch(/from public\.community_admins a where a\.user_id = auth\.uid\(\)/i);
    expect(setModeratorRpc).not.toMatch(/is_community_staff/i);
    expect(rosterPolicy).toMatch(/community_admins/i);
    expect(rosterPolicy).not.toMatch(/is_community_staff/i);
    expect(code).toMatch(/revoke insert, update, delete, truncate, references, trigger on public\.community_moderators from public, anon, authenticated/i);
    expect(code).toMatch(/revoke insert, update, delete, truncate, references, trigger on public\.community_admins from public, anon, authenticated/i);
  });

  it("moderadora comum não recebe escrita direta nos campos protegidos", () => {
    expect(code).toMatch(/revoke insert, update, delete, truncate, references, trigger on public\.posts from public, anon, authenticated/i);
    expect(code).toMatch(/revoke insert, update, delete, truncate, references, trigger on public\.post_reports from public, anon, authenticated/i);
    expect(code).toMatch(/revoke insert, update, delete, truncate, references, trigger on public\.moderation_actions from public, anon, authenticated/i);
    expect(code).toMatch(/grant insert \(user_id, author_name, content, image_url, image_path\) on public\.posts to authenticated/i);
    expect(code).toMatch(/grant insert \(post_id, user_id, reason\) on public\.post_reports to authenticated/i);
    expect(code).not.toMatch(/grant (update|all)[^;]*on public\.(posts|post_reports)/i);
  });

  it("bloqueia comentários e curtidas em publicações ocultas ou removidas para todos os papéis", () => {
    for (const policy of [commentInsert, likeInsert]) {
      expect(policy).toMatch(/auth\.uid\(\) = user_id/i);
      expect(policy).toMatch(/p\.moderation_status = 'visible'/i);
      expect(policy).not.toMatch(/is_community_staff|community_moderators|community_admins|\bor\b/i);
    }
  });

  it("não semeia administradora com UUID fixo", () => {
    expect(code).not.toMatch(/insert into public\.community_admins/i);
    expect(code).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  });
});
