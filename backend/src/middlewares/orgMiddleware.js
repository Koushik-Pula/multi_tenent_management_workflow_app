export const attachOrg = (req,res,next) => {
    const orgId = req.user.orgId;
    if(!orgId){
        return res.status(400).json({message: 'organization id is required'});
    }

    req.orgId = orgId;
    next();
};