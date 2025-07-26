const { navAdmin } = require('../utilities/componentData.js');

const injectNavAdmin = (req, res, next) => {
    res.locals.navAdmin = navAdmin;
    next();
};

module.exports = injectNavAdmin;
