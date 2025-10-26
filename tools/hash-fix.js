// tools/hash-fix.js
import db from '../utils/db.js';     // dùng lại đúng kết nối của app
import bcrypt from 'bcryptjs';

const toFix = [
   { name: 'admin',   plain: '123456'  },
  { name: 'A',   plain: '123456'  },
  { name: 'B',   plain: '123456'  },
  { name: 'C',   plain: '123456'  },
  { name: 'D',   plain: '123456'  },
  { name: 'E',   plain: '123456'  },
  { name: 'F',   plain: '123456'  },
  { name: 'G',   plain: '123456'  },
  { name: 'H',   plain: '123456'  },
  { name: 'I',   plain: '123456'  },
  { name: 'K',   plain: '123456'  },

  { name: 'tuan', plain: '123456'  },
  // thêm user khác nếu bạn biết mật khẩu gốc
];

(async () => {
  try {
    console.log('Connecting & fixing...');
    for (const u of toFix) {
      console.log('Checking:', u.name);
      const row = await db('users').where({ name: u.name }).first();

      if (!row) { console.log('⚠️ Not found:', u.name); continue; }

      // nếu đã hash thì bỏ qua
      if (typeof row.password === 'string' && row.password.startsWith('$2')) {
        console.log('ℹ️ Already hashed:', u.name);
        continue;
      }

      const hashed = bcrypt.hashSync(u.plain, 10);
      await db('users').where({ id: row.id }).update({ password: hashed });
      console.log('✅ Fixed:', u.name);
    }
  } catch (e) {
    console.error('❌ Error:', e);
  } finally {
    await db.destroy();
    console.log('Done.');
  }
})();
