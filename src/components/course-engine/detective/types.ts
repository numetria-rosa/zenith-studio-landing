/* Math Detective's data model - a math-flavored adaptation of the two-phase
   "charge sheet then fix" pattern from courses/ai-assisted-software-engineering/
   detective-kit.js. That original grades a mix of real defects and plausible-
   but-wrong ones (over-selecting fails exactly like under-selecting) and only
   unlocks a fix step once the charge sheet is exactly right. There's no code
   to run here, so "the fix" becomes picking the correctly-qualified version
   of the original flawed claim, rather than passing a hidden test suite -
   but the rigor (all-or-nothing charge sheet, then a separate proof step) is
   the same discipline, not a simplified multiple-choice quiz in disguise. */

export type ChargeSheetItem = {
  id: string;
  label: string;
  /** True = this statement is actually TRUE/accurate. False = it's the kind
      of plausible-sounding but wrong statement someone might mistakenly
      accept. Selecting it (or failing to select a true one) is a miss. */
  isTrue: boolean;
  why: string;
};

export type FixOption = {
  text: string;
  correct: boolean;
  feedback: string;
};

export type DetectiveScenario = {
  id: string;
  title: string;
  /** The flawed claim under investigation, quoted as spoken. */
  claim: string;
  claimSource: string;
  context: string;
  chargeSheet: ChargeSheetItem[];
  fixOptions: FixOption[];
};
