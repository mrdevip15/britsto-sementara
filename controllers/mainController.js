const { faqsprivat, faqssnbt, cardPrivat, cardSnbt } = require('../utilities/componentData.js');
// mainController.js

function renderView(viewName, faqsData, cardData) {
    return (req, res) => {
        res.render(viewName, { user: req.user, faqs: faqsData, cardData });
    };
}

// Define exports for each route, using the correct FAQs data

const home = renderView('index', faqsprivat, cardPrivat);
const signup = renderView('signup', faqsprivat);
const contacts = renderView('contacts', faqsprivat);
const snbt = renderView('snbt', faqssnbt, cardSnbt); // Using faqssnbt specifically for 'snbt' view
const tosnbt = renderView('to-snbt', faqssnbt);
const signin = renderView('signin')
const privacyPolicy = renderView('privacy-policy'); // Added privacy policy view

// Export each controller to be used in your routing setup
module.exports = {
    home,
    signup,
    contacts,
    snbt,
    tosnbt,
    signin,
    privacyPolicy // Exporting the new privacy policy controller
};

