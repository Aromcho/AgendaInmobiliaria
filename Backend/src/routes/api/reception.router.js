import express from 'express';
import { createReception, deleteReception, getReception, updateReception } from '../../controllers/reception.controller.js';
import isAuth from '../../middelwares/isAuth.mid.js';

const router = express.Router();

router.get('/', isAuth, getReception);
router.post('/', isAuth, createReception);
router.put('/:id', isAuth, updateReception);
router.delete('/:id', isAuth, deleteReception);

export default router;
