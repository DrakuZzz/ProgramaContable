import { Router } from 'express';
import { getCuentas, addCuentas, getCuentasSimples} from '../controllers/cuentascontroller.js';

const router = Router();
router.get('/cuentas', getCuentas);

router.post('/add', addCuentas);

router.get('/simples', getCuentasSimples);

export default router;