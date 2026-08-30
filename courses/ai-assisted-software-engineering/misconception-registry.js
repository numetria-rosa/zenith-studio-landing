(function (global) {
  const TAGS = {
    "ai-owns-the-bug": "The agent wrote it, so the bug is not yours. False: you shipped it.",
    "lgtm-is-a-review": "Looks good to me without a named check is not a review.",
    "green-means-tested": "A test that only asserts true === true is theater.",
    "chat-is-a-repo": "A Cursor transcript is not GitHub evidence.",
    "skip-git": "AI-assisted engineers still use Git. The lab is required.",
    "lang-vs-job": "This course ships web apps. AI Engineering builds LLM products. Different jobs.",
  };
  global.MisconceptionRegistry = { TAGS };
})(window);
