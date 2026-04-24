import * as categoryModel from '../models/category.model.js';
import * as courseModel from '../models/course.model.js';

const COURSES_PER_PAGE = 9;

export async function getCategoryWithCourses(categoryId, page = 1) {
  const parentCategoryId = parseInt(categoryId, 10);
  const category = await categoryModel.findById(parentCategoryId);
  if (!category) return null;

  const childIds = await categoryModel.findChildIds(parentCategoryId);
  const allCategoryIds = [parentCategoryId, ...childIds];

  const limit = COURSES_PER_PAGE;
  const offset = (page - 1) * limit;

  const [courses, totalCourses] = await Promise.all([
    courseModel.findPageByCategoryIds(allCategoryIds, limit, offset),
    courseModel.countByCategoryIds(allCategoryIds)
  ]);

  const totalPages = Math.ceil(totalCourses / limit);

  return {
    category,
    courses,
    empty: courses.length === 0,
    page,
    totalPages
  };
}
