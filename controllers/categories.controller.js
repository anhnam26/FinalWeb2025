import * as categoryModel from '../models/categories.model.js';

export async function deleteCategory(req, res) {
  const { id } = req.body;

  try {
    await categoryModel.remove(id);
    res.redirect('/admin/categories');
  } catch (err) {
    console.error('Lỗi khi xóa lĩnh vực:', err);
    res.render('admin/categories', {
      error: 'Không thể xóa lĩnh vực này.',
      categories: await categoryModel.getAllWithCourseCount()
    });
  }
}
