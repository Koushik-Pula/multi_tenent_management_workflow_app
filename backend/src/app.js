import express from 'express';
import authRoutes from './routes/authRoutes.js';
import { authenticate } from "./middlewares/authMiddleware.js";

const app = express();

app.use(express.json());

app.get('/health' , (req,res)=>{
    res.status(200).send('OK');
});

app.get("/me", authenticate, (req, res) => {
    res.json({
        message: "You are authenticated",
        user: req.user
    });
});

app.use('/auth',authRoutes);

export default app;