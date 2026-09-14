import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';

fs.mkdirSync('data',{recursive:true});
export const db=new Database(process.env.DB_PATH||'data/app.db');
db.pragma('journal_mode = WAL'); db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS roles(id INTEGER PRIMARY KEY,name TEXT UNIQUE,permissions TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,first_name TEXT,last_name TEXT,login TEXT UNIQUE,password_hash TEXT,role_id INTEGER,is_active INTEGER DEFAULT 1,extra_permissions TEXT DEFAULT '[]',created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(role_id) REFERENCES roles(id));
CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY,code TEXT UNIQUE,name TEXT,description TEXT,city TEXT,start_date TEXT,end_date TEXT,status TEXT DEFAULT 'ACTIVE',budget REAL DEFAULT 0,coordinator_id INTEGER,notes TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS project_members(project_id INTEGER,user_id INTEGER,PRIMARY KEY(project_id,user_id));
CREATE TABLE IF NOT EXISTS locations(id INTEGER PRIMARY KEY,name TEXT,address TEXT,type TEXT DEFAULT 'WAREHOUSE',active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS units(id INTEGER PRIMARY KEY,name TEXT UNIQUE,active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY,name TEXT UNIQUE,active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS suppliers(id INTEGER PRIMARY KEY,name TEXT,nip TEXT,contact TEXT,phone TEXT,email TEXT,website TEXT,notes TEXT);
CREATE TABLE IF NOT EXISTS requests(id INTEGER PRIMARY KEY,number TEXT UNIQUE,title TEXT,description TEXT,justification TEXT,department TEXT,purchase_type TEXT,project_id INTEGER,client TEXT,priority TEXT DEFAULT 'NORMAL',deadline TEXT,delivery_date TEXT,location_id INTEGER,external_address TEXT,notes TEXT,status TEXT DEFAULT 'DRAFT',requester_id INTEGER,assigned_buyer_id INTEGER,supplier_order_no TEXT,planned_delivery TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS items(id INTEGER PRIMARY KEY,request_id INTEGER,name TEXT,code TEXT,description TEXT,product_url TEXT,quantity REAL,unit TEXT,estimated_price REAL DEFAULT 0,actual_price REAL DEFAULT 0,vat REAL DEFAULT 23,supplier_id INTEGER,category_id INTEGER,notes TEXT,FOREIGN KEY(request_id) REFERENCES requests(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS approvals(id INTEGER PRIMARY KEY,request_id INTEGER,user_id INTEGER,decision TEXT,comment TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS offers(id INTEGER PRIMARY KEY,request_id INTEGER,supplier_id INTEGER,amount REAL,delivery_days INTEGER,notes TEXT,selected INTEGER DEFAULT 0,selected_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS deliveries(id INTEGER PRIMARY KEY,request_id INTEGER,delivered_at TEXT,received_by INTEGER,complete INTEGER,compliant INTEGER,damaged INTEGER,comment TEXT,verified INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS attachments(id INTEGER PRIMARY KEY,request_id INTEGER,name TEXT,path TEXT,url TEXT,type TEXT,uploaded_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY,user_id INTEGER,title TEXT,message TEXT,request_id INTEGER,is_read INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit_logs(id INTEGER PRIMARY KEY,user_id INTEGER,request_id INTEGER,action TEXT,details TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);
export const permissions={ADMIN:['*'],DIRECTOR:['request:read','request:approve','request:create','project:manage','budget:read','report:read','budget:override'],COORDINATOR:['request:create','request:read','project:read'],TECHNICAL:['request:create','request:read'],BUYER:['request:read','purchase:manage','supplier:manage','delivery:manage','report:read']};
export function seed(){
 const roles=db.prepare('SELECT count(*) n FROM roles').get() as any;if(roles.n)return;
 const ir=db.prepare('INSERT INTO roles(name,permissions) VALUES (?,?)'); Object.entries(permissions).forEach(([k,v])=>ir.run(k,JSON.stringify(v)));
 const user=db.prepare('INSERT INTO users(first_name,last_name,login,password_hash,role_id) VALUES(?,?,?,?,(SELECT id FROM roles WHERE name=?))');
 const hash=bcrypt.hashSync('NaszPrad!2026',12); [['Anna','Kowalska','admin','ADMIN'],['Marek','Nowak','dyrektor','DIRECTOR'],['Joanna','Lis','koordynator','COORDINATOR'],['Piotr','Maj','techniczny','TECHNICAL'],['Kamil','Wójcik','zakupowiec','BUYER']].forEach(x=>user.run(x[0],x[1],x[2],hash,x[3]));
 ['szt.','kpl.','mb','m','m²','kg','opak.','rolka','paleta'].forEach(x=>db.prepare('INSERT INTO units(name) VALUES(?)').run(x)); ['Materiały elektryczne','Narzędzia','BHP','Usługi','Transport'].forEach(x=>db.prepare('INSERT INTO categories(name) VALUES(?)').run(x));
 db.prepare("INSERT INTO locations(name,address,type) VALUES ('Magazyn główny','ul. Energetyczna 12, Poznań','WAREHOUSE'),('Biuro Golina','ul. Kolejowa 4, Golina','OFFICE')").run();
 db.prepare("INSERT INTO suppliers(name,nip,contact,phone,email,website) VALUES ('Elektro-Max Sp. z o.o.','7771234567','Adam Król','+48 600 100 200','handel@elektromax.pl','https://example.com'),('Kable Polska S.A.','5251112233','Ewa Bąk','+48 600 200 300','oferty@kable.pl','https://example.com')").run();
 db.prepare("INSERT INTO projects(code,name,description,city,start_date,end_date,budget,coordinator_id) VALUES ('PRJ/2026/01','Farma fotowoltaiczna Golina','Budowa instalacji 2 MW','Golina','2026-01-10','2026-11-30',600000,3),('PRJ/2026/02','Modernizacja GPZ Konin','Modernizacja rozdzielni','Konin','2026-02-01','2026-10-15',420000,3),('WEW/2026','Koszty wewnętrzne','Zakupy operacyjne','Poznań','2026-01-01','2026-12-31',120000,3)").run();
 const req=db.prepare('INSERT INTO requests(number,title,description,department,purchase_type,project_id,priority,deadline,delivery_date,location_id,status,requester_id,assigned_buyer_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)');
 const item=db.prepare('INSERT INTO items(request_id,name,code,quantity,unit,estimated_price,actual_price,vat,category_id,supplier_id) VALUES(?,?,?,?,?,?,?,?,?,?)');
 const samples=[['ZAK/2026/00001','Kable solarne DC','Kable do sekcji A','Techniczny','PROJECT',1,'CRITICAL','2026-09-15','2026-09-18',1,'PENDING_APPROVAL',3,null,24000,0],['ZAK/2026/00002','Rozdzielnice nN','Rozdzielnice obiektowe','Realizacja','PROJECT',2,'HIGH','2026-09-20','2026-09-22',1,'ORDERED',3,5,72000,68400],['ZAK/2026/00003','Środki ochrony osobistej','Wyposażenie brygad','BHP','INTERNAL',3,'NORMAL','2026-09-25','2026-09-28',2,'IN_DELIVERY',4,5,8500,7900],['ZAK/2026/00004','Falowniki 100 kW','Dostawa falowników','Techniczny','PROJECT',1,'HIGH','2026-09-17','2026-09-20',1,'DELIVERED',3,5,130000,125000]];
 samples.forEach((x:any)=>{const r=req.run(...x.slice(0,13));item.run(r.lastInsertRowid,x[1],`MAT-${r.lastInsertRowid}`,1,'kpl.',x[13],x[14],23,1,x[14]?1:null);});
 db.prepare("INSERT INTO offers(request_id,supplier_id,amount,delivery_days,notes,selected,selected_by) VALUES (2,1,68400,4,'Transport w cenie',1,5),(2,2,71200,2,'Dostępne od ręki',0,NULL)").run();
 db.prepare("INSERT INTO deliveries(request_id,delivered_at,received_by,complete,compliant,damaged,comment,verified) VALUES (4,'2026-09-10',3,1,1,0,'Dostawa bez uwag',1)").run();
 db.prepare("INSERT INTO audit_logs(user_id,request_id,action,details) VALUES (3,1,'CREATED','Utworzono zapotrzebowanie'),(3,1,'SUBMITTED','Wysłano do akceptacji'),(2,2,'APPROVED','Zatwierdzono zakup'),(5,2,'ORDERED','Złożono zamówienie u dostawcy')").run();
 db.prepare("INSERT INTO notifications(user_id,title,message,request_id) VALUES (2,'Nowe zamówienie do akceptacji','Kable solarne DC wymagają decyzji',1),(5,'Dostawa za 2 dni','Rozdzielnice nN — sprawdź termin',2)").run();
}
seed();
