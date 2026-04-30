import express from 'express';
import * as categoryController from '../controllers/categories.controller.js';
const router = express.Router();

// ...existing code...

// Route xem danh mục (tách controller)

router.get('/:id', categoryController.getCategoryById);

export default router;