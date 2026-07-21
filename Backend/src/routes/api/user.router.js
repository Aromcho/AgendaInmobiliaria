import express from 'express';
import { createUser, deleteUser, getRoster, getTeamUsers, getUserById, getUsers, updateUser } from '../../controllers/user.controller.js';
import isAuth from '../../middelwares/isAuth.mid.js';
import isSuperAdmin from '../../middelwares/isSuperAdmin.mid.js';
import isAdmin from '../../middelwares/isAdmin.mid.js';

const router = express.Router();

router.get('/', isAuth, isSuperAdmin, getUsers);
router.post('/', isAuth, isSuperAdmin, createUser);
router.get('/roster', isAuth, getRoster);
router.get('/team', isAuth, isAdmin, getTeamUsers);
router.get('/:uid', isAuth, isSuperAdmin, getUserById);
router.put('/:uid', isAuth, isSuperAdmin, updateUser);
router.delete('/:uid', isAuth, isSuperAdmin, deleteUser);

export default router;
