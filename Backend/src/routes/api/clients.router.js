import express from 'express';
import { createClient, deleteClient, getClients, updateClient } from '../../controllers/clients.controller.js';
import isAuth from '../../middelwares/isAuth.mid.js';

const router = express.Router();

router.get('/', isAuth, getClients);
router.post('/', isAuth, createClient);
router.put('/:id', isAuth, updateClient);
router.delete('/:id', isAuth, deleteClient);

export default router;
