import express from 'express';
import { login, online, logout, register } from '../../controllers/session.controller.js';

const router = express.Router();

router.post('/login', login);
router.get('/online', online);
router.delete('/logout', logout);
router.post('/register', register);

export default router;
