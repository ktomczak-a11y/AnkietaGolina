import {describe,it,expect} from 'vitest';
import {db} from '../db.ts';
describe('model danych i seed',()=>{
 it('zawiera wszystkie kluczowe encje',()=>{const names=(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[]).map(x=>x.name);for(const n of ['users','roles','projects','project_members','requests','items','approvals','suppliers','offers','deliveries','attachments','locations','units','categories','notifications','audit_logs'])expect(names).toContain(n)});
 it('przechowuje wyłącznie hashe haseł',()=>{const u:any=db.prepare("SELECT password_hash FROM users WHERE login='admin'").get();expect(u.password_hash).toMatch(/^\$2/);expect(u.password_hash).not.toContain('NaszPrad')});
 it('ma pełny zestaw ról demonstracyjnych',()=>{expect((db.prepare('SELECT count(*) n FROM roles').get() as any).n).toBe(5)});
 it('seeduje projekty, zamówienia i oferty',()=>{expect((db.prepare('SELECT count(*) n FROM projects').get() as any).n).toBeGreaterThanOrEqual(3);expect((db.prepare('SELECT count(*) n FROM requests').get() as any).n).toBeGreaterThanOrEqual(4);expect((db.prepare('SELECT count(*) n FROM offers').get() as any).n).toBeGreaterThanOrEqual(2)});
});
