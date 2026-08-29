/* Pure access decision for guarded course files. The route still does
   auth() and hasCourseAccess(); this only names the four outcomes so
   they can be checked without a browser session. */

export type CourseAccessDecision =
  | { action: "not-found" }
  | { action: "redirect-sign-in" }
  | { action: "redirect-landing" }
  | { action: "serve" };

export function decideCourseAccess(input: {
  coursePublished: boolean;
  userId: string | null | undefined;
  entitled: boolean;
}): CourseAccessDecision {
  if (!input.coursePublished) return { action: "not-found" };
  if (!input.userId) return { action: "redirect-sign-in" };
  if (!input.entitled) return { action: "redirect-landing" };
  return { action: "serve" };
}
