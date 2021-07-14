import i18n from "i18next";
import { reactI18nextModule } from "react-i18next";

import en from './locales/en/translations.json';
import pt from './locales/pt/translations.json';

// the translations
const resources = {
    en: {
        translation: en
    },
    pt: {
        translation: pt
    }
};

i18n
    .use(reactI18nextModule) // passes i18n down to react-i18next
    .init({
        resources,
        lng: "pt",

        keySeparator: '.', // we do not use keys in form messages.welcome

        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;