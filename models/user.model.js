import db from '../utils/db.js';

export function findByUsername(username) {
  return db('users').where('username', username).first();
}
export function findByName(name) {
  return db('users').where('name', name).first();
}

export function patch(id, user) {
  return db('users').where('id', id).update(user);
}

export async function add(user) {
  return db('users').insert(user);
}

