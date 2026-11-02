import express from 'express';
import { login, online, logout, register } from '../../controllers/session.controller.js';
import isAuth from '../../middelwares/isAuth.mid.js';
import isSuperAdmin from '../../middelwares/isSuperAdmin.mid.js';

const router = express.Router();

router.post('/login', login);
router.get('/online', online);
router.delete('/logout', logout);
// Antes era pública y tomaba el rol del body: cualquiera podía crearse un SUPER_ADMIN.
router.post('/register', isAuth, isSuperAdmin, register);

export default router;
