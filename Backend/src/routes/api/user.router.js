import express from 'express';
import { createUser, deleteUser, getUserById, getUsers, updateUser } from '../../controllers/user.controller.js';
import isAuth from '../../middelwares/isAuth.mid.js';
import isSuperAdmin from '../../middelwares/isSuperAdmin.mid.js';

const router = express.Router();

router.get('/', isAuth, isSuperAdmin, getUsers);
router.post('/', isAuth, isSuperAdmin, createUser);
router.get('/:uid', isAuth, isSuperAdmin, getUserById);
router.put('/:uid', isAuth, isSuperAdmin, updateUser);
router.delete('/:uid', isAuth, isSuperAdmin, deleteUser);

export default router;
