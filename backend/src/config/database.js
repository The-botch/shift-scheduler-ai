import pkg from 'pg'
const { Pool } = pkg
import './env.js' // 環境変数を読み込む

// Railway PostgreSQL接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// 接続テスト
pool.on('connect', async (client) => {
  // タイムゾーンをJST（日本標準時）に設定
  await client.query("SET timezone = 'Asia/Tokyo'");
  console.log('✅ Database connected successfully (timezone: Asia/Tokyo)');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

/**
 * クエリ実行
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * トランザクション実行
 */
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 接続プール取得
 */
export function getPool() {
  return pool;
}

export default { query, transaction, getPool };
