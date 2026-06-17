import express from 'express';
import { getLinkPreview } from '../../controllers/linkPreview.controller.js';
import isAuth from '../../middelwares/isAuth.mid.js';

const router = express.Router();

router.get('/', isAuth, getLinkPreview);

export default router;
