import express from 'express';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

const app = express();

app.use(express.json());

app.get('/health' , (req,res)=>{
    res.status(200).send('OK');
});



app.use('/auth',authRoutes);
app.use('/users',userRoutes);
app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);


export default app;