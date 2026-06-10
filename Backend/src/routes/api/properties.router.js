import express from 'express';
import { createProperty, deleteProperty, getProperties, updateProperty } from '../../controllers/properties.controller.js';
import isAuth from '../../middelwares/isAuth.mid.js';

const router = express.Router();

router.get('/', isAuth, getProperties);
router.post('/', isAuth, createProperty);
router.put('/:id', isAuth, updateProperty);
router.delete('/:id', isAuth, deleteProperty);

export default router;
