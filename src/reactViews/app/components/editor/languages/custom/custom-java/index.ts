import { getLanguageBuilder, getSchemaBuilder } from 'components/editor/languages/custom/utils';
import { LanguageRegistrar } from 'components/editor/languages/types';
import { completions, conf, lang } from './language';

const LANGUAGE_NAME = 'CustomJava';
export const registerCustomJava: LanguageRegistrar = {
  language: getLanguageBuilder(LANGUAGE_NAME, { lang, conf, completions }),
  schema: getSchemaBuilder(LANGUAGE_NAME, { completions }),
};
