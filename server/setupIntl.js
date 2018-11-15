// Polyfill Node with `Intl` that has data for all locales.
// See: https://formatjs.io/guides/runtime-environments/#server
const IntlPolyfill = require('intl');
Intl.NumberFormat = IntlPolyfill.NumberFormat;
Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;

const { readFileSync } = require('fs');
const { basename } = require('path');
const accepts = require('accepts');
const glob = require('glob');

const DefaultLocale = 'en';

// Get the supported languages by looking for translations in the `lang/` dir.
const languages = glob.sync('./lang/*.json').map(f => basename(f, '.json'));

// We need to expose React Intl's locale data on the request for the user's
// locale. This function will also cache the scripts by lang in memory.
const localeDataCache = new Map();
const getLocaleDataScript = locale => {
  const lang = locale.split('-')[0];
  if (!localeDataCache.has(lang)) {
    let localeDataFile;
    try {
      localeDataFile = require.resolve(`react-intl/locale-data/${lang}`);
    } catch(err) {
      // Failed to load language
      localeDataFile = require.resolve(`react-intl/locale-data/${DefaultLocale}`);
    }

    const localeDataScript = readFileSync(localeDataFile, 'utf8');
    localeDataCache.set(lang, localeDataScript);
  }

  return localeDataCache.get(lang);
};

// We need to load and expose the translations on the request for the user's
// locale. These will only be used in production, in dev the `defaultMessage` in
// each message description in the source code will be used.
const getMessages = locale => {
  try {
    return require(`../lang/${locale}.json`);
  } catch (err) {
    // Failed to load messages
    return require(`../lang/${DefaultLocale}.json`);
  }

};

function setupIntl(req, dev) {
  const accept = accepts(req);
  const localMatch = accept.language(languages) || DefaultLocale;
  const bestLocaleMatch = Array.isArray(localMatch) ? localMatch[0] : localMatch;

  // Use ?lang query param override if present
  const locale = req.query.lang || bestLocaleMatch;

  req.locale = locale;
  req.localeDataScript = getLocaleDataScript(locale);
  req.messages = dev ? {} : getMessages(locale);
}

module.exports = setupIntl;
