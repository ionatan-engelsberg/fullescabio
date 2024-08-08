import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';

function initialize(passport, getUserByUsernameAndBusiness, getUserById) {
  const authenticateUser = async (username, password, business, done) => {
    const user = getUserByUsernameAndBusiness(username, business);
    if (user == null) {
      return done(null, false, { message: 'Combinación Incorrecta' });
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Combinación Incorrecta' });
      }
    } catch (e) {
      return done(e);
    }
  }

  passport.use(new LocalStrategy(
    { usernameField: 'username', passwordField: 'password', passReqToCallback: true },
    (req, username, password, done) => {
      const { business } = req.body;
      authenticateUser(username, password, business, done);
    }
  ));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) => {
    return done(null, getUserById(id));
  });
}

export default initialize;
