import * as categoryModel from '../models/category.model.js';

import * as categoryService from '../services/category.service.js';

// Controller: Xem danh mục theo id (gọi service)
export async function getCategoryById(req, res, next) {
  try {
    const page = parseInt(req.query.page || 1, 10);
    const result = await categoryService.getCategoryWithCourses(req.params.id, page);
    if (!result) {
      return res.status(404).render('404');
    }
    res.render('vwCourse/byCategory', {
      layout: 'main',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

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