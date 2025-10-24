import db from '../utils/db.js';

export async function findByUsername(username) {
  const user = await db('users').where('username', username).first();
  return user || null;
}

export async function patch(id, user) {
  return db('users').where('id', id).update(user);
}

export async function add(user) {
  return db('users').insert(user);
}

export async function findByEmail(email) {
  const user = await db('users').where('email', email).first();
  return user || null;
}
