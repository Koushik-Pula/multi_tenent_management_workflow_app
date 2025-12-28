import {Router} from 'express';
import {signup,login,refresh,logout,me} from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';


const router = Router();

//auth routes
router.post('/signup', signup);
router.post('/login',login);
router.post('/refresh',refresh);
router.post('/logout',logout);  
router.get("/me",authenticate, me);




export default router;