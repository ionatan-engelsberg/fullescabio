import express from 'express';
import passport from "passport";
import { checkNotAuthenticated } from '../middlewares/auth.mjs';
const router = express.Router();

router.get('/', checkNotAuthenticated, (req, res) => {
    res.render('login');
});

router.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/',
    failureFlash: true
}));

router.delete('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) { 
            return next(err); 
        }
        res.redirect('/');
    });
});

export default router