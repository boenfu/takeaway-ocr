import {Takeaway, TakeawayChecker} from '../takeaway';

const takeawayToExtraTextsSet = new WeakMap<Takeaway, Map<string, number>>();

export const checkExtraText: TakeawayChecker = (takeaway, word, context) => {
  let textMap = takeawayToExtraTextsSet.get(takeaway);

  if (!textMap) {
    textMap = new Map(context.extraTexts!.map((text, index) => [text, index]));
    takeawayToExtraTextsSet.set(takeaway, textMap);
  }

  if (!textMap.has(word)) {
    return;
  }

  takeaway.extraTexts![textMap.get(word)!] = true;
};
