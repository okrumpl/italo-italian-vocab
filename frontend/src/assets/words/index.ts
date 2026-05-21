// @ts-ignore
import { vocabulary, getExpandedVocabulary } from './vocabulary.js';
import extraWords from './extra_words.json';
import massiveWords from './massive_words.json';
import massiveWords2 from './massive_words_2.json';
import massiveWords3 from './massive_words_3.json';
import massiveWords4 from './massive_words_4.json';

export const getAllWords = () => {
  const words: any[] = [];
  if (Array.isArray(vocabulary)) {
     words.push(...vocabulary);
  }
  if (typeof getExpandedVocabulary === 'function') {
     words.push(...getExpandedVocabulary());
  }

  if (Array.isArray(extraWords)) words.push(...extraWords);
  if (Array.isArray(massiveWords)) words.push(...massiveWords);
  if (Array.isArray(massiveWords2)) words.push(...massiveWords2);
  if (Array.isArray(massiveWords3)) words.push(...massiveWords3);
  if (Array.isArray(massiveWords4)) words.push(...massiveWords4);
  
  return words;
};
