import db from '../utils/db.js';

export async function getAllWithCourseCount() {
  return db('categories as c')
    .leftJoin('courses as cs', 'cs.category_id', 'c.id')
    .select('c.id', 'c.catname as name')
    .count('cs.id as courseCount')
    .groupBy('c.id', 'c.catname')
    .orderBy('c.id', 'asc')
    .then(rows =>
      rows.map(r => ({
        ...r,
        courseCount: Number(r.courseCount)
      }))
    );
}


export async function add(category) {
  return await db('categories').insert({ catname: category.name });
}

export async function patch(id, category) {
  return await db('categories').where('id', id).update({ catname: category.name });
}

export async function remove(id) {
  return await db('categories').where('id', id).del();
}
