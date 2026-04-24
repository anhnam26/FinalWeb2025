import express from 'express';
import * as categoryController from '../controllers/categories.controller.js';
const router = express.Router();

// ...existing code...

// Route xem danh mục (tách controller)
router.get('/:id', categoryController.getCategoryById);
            pagination: {
                totalPages: totalPages,
                currentPage: page,
                queryString: null // <-- Không có query string
            }
        });

    } catch (err) {
        console.error(err);
        next(err);
    }
});

export default router;