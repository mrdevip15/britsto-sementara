const { navUser } = require('../utilities/componentData.js');

const injectNavUser = (req, res, next) => {
    res.locals.navAdmin = navUser;
    next();
};

module.exports = injectNavUser;
