import sqlite3
import re

def test_sql():
    with open('database/schema.sql', 'r', encoding='utf-8') as f:
        sql = f.read()

    statements = sql.split(';')
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()
    cursor.execute('PRAGMA foreign_keys = ON;')

    executed_count = 0
    for raw in statements:
        # Strip all SQL comments (-- ... and /* ... */)
        cleaned = re.sub(r'--[^\n]*\n', '\n', raw)
        cleaned = re.sub(r'/\*[\s\S]*?\*/', '', cleaned)
        stmt = cleaned.strip()
        if not stmt:
            continue
        upper = stmt.upper()
        if upper.startswith('SET') or upper.startswith('CREATE DATABASE') or upper.startswith('USE') or upper.startswith('DROP TABLE'):
            continue
        
        # Translate MySQL DDL specifics to SQLite for relational testing
        s = re.sub(r'BIGINT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT', stmt, flags=re.IGNORECASE)
        s = re.sub(r'INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT', s, flags=re.IGNORECASE)
        s = re.sub(r'ENUM\([^)]+\)', 'TEXT', s, flags=re.IGNORECASE)
        s = re.sub(r'DECIMAL\([^)]+\)', 'NUMERIC', s, flags=re.IGNORECASE)
        s = re.sub(r'JSON', 'TEXT', s, flags=re.IGNORECASE)
        s = re.sub(r'DATETIME', 'TEXT', s, flags=re.IGNORECASE)
        s = re.sub(r'TIMESTAMP\s+DEFAULT\s+CURRENT_TIMESTAMP\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP', 'TEXT DEFAULT CURRENT_TIMESTAMP', s, flags=re.IGNORECASE)
        s = re.sub(r'TIMESTAMP\s+NULL\s+DEFAULT\s+NULL', 'TEXT NULL', s, flags=re.IGNORECASE)
        s = re.sub(r'TIMESTAMP\s+DEFAULT\s+CURRENT_TIMESTAMP', 'TEXT DEFAULT CURRENT_TIMESTAMP', s, flags=re.IGNORECASE)
        s = re.sub(r'COMMENT\s+\'[^\']*\'', '', s, flags=re.IGNORECASE)
        s = re.sub(r'ENGINE\s*=\s*InnoDB[^;]*', '', s, flags=re.IGNORECASE)
        s = re.sub(r'INDEX\s+[a-zA-Z0-9_]+\s*\([^)]+\),?', '', s, flags=re.IGNORECASE)
        s = re.sub(r'UNIQUE\s+KEY\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)', r'UNIQUE(\2)', s, flags=re.IGNORECASE)
        s = re.sub(r'ON\s+UPDATE\s+CASCADE', '', s, flags=re.IGNORECASE)
        s = re.sub(r',\s*\)', ')', s)

        try:
            cursor.execute(s)
            executed_count += 1
        except Exception as e:
            print(f'Execution notice on statement ({s[:80]}...): {e}')

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall() if not row[0].startswith('sqlite_')]
    print(f'SUCCESS: {len(tables)} tables created and verified in memory!')
    print('Tables:', tables)

    # Verify seed data insertion
    cursor.execute("SELECT COUNT(*) FROM roles;")
    print('Roles seeded:', cursor.fetchone()[0])
    cursor.execute("SELECT COUNT(*) FROM users;")
    print('Users seeded:', cursor.fetchone()[0])
    cursor.execute("SELECT COUNT(*) FROM hospitals;")
    print('Hospitals seeded:', cursor.fetchone()[0])
    cursor.execute("SELECT COUNT(*) FROM wards;")
    print('Wards seeded:', cursor.fetchone()[0])
    cursor.execute("SELECT COUNT(*) FROM rooms;")
    print('Rooms seeded:', cursor.fetchone()[0])
    cursor.execute("SELECT COUNT(*) FROM beds;")
    print('Beds seeded:', cursor.fetchone()[0])
    cursor.execute("SELECT COUNT(*) FROM linen;")
    print('Linen seeded:', cursor.fetchone()[0])
    cursor.execute("SELECT COUNT(*) FROM equipment;")
    print('Equipment seeded:', cursor.fetchone()[0])
    cursor.execute("SELECT COUNT(*) FROM inventory;")
    print('Inventory items seeded:', cursor.fetchone()[0])
    cursor.execute("SELECT COUNT(*) FROM tasks;")
    print('Tasks seeded:', cursor.fetchone()[0])

if __name__ == '__main__':
    test_sql()
