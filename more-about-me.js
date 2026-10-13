const chatForm = document.querySelector("#chatForm");
const questionInput = document.querySelector("#visitorQuestion");
const chatThread = document.querySelector("#chatThread");
const signButtons = document.querySelectorAll(".clickable-sign");
const quickQuestionButtons = document.querySelectorAll("[data-question]");
const submitButton = chatForm?.querySelector('button[type="submit"]');

const revealScenes = document.querySelectorAll(".more-scene, .chat-scene");
const revealThreshold = 0.18;

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio >= revealThreshold) {
          entry.target.classList.add("is-visible");
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    },
    { threshold: [0, revealThreshold], rootMargin: "0px 0px -8% 0px" },
  );

  revealScenes.forEach((scene) => revealObserver.observe(scene));
} else {
  revealScenes.forEach((scene) => scene.classList.add("is-visible"));
}

const knowledgeBase = window.MORE_ABOUT_ME_KNOWLEDGE_BASE || {};
const qaEntries = Array.isArray(knowledgeBase.qa) ? knowledgeBase.qa : [];
const fallbackAnswers = Array.isArray(knowledgeBase.fallback) ? knowledgeBase.fallback : [];

const normalizeQuestion = (value) =>
  String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");

const removeQuestionFillers = (value) =>
  normalizeQuestion(value)
    .replace(/^(请问|我想问|想问一下|想知道|可以说说|能不能说说|介绍一下)/, "")
    .replace(/蓝标/g, "蓝色光标")
    .replace(/啥/g, "什么")
    .replace(/(干嘛|干什么)/g, "做什么")
    .replace(/(都)?做了?(哪些|什么|啥)(事情|工作|内容)?/g, "做什么")
    .replace(/主要负责了?(哪些|什么|啥)(事情|工作|内容)?/g, "做什么")
    .replace(/负责了?(哪些|什么|啥)(事情|工作|内容)?/g, "做什么")
    .replace(/[呀啊哇啦呢吗嘛哦呐]+$/g, "");

const questionCandidates = qaEntries.flatMap((entry) =>
  [entry.question, ...(entry.similar_questions || [])].map((question) => ({
    answer: entry.answer,
    normalized: removeQuestionFillers(question),
  })),
);

const mappedQuestions = new Map(
  Object.entries(knowledgeBase.similar_mapping || {}).map(([question, target]) => [
    removeQuestionFillers(question),
    target,
  ]),
);

const answerByQuestion = new Map(
  qaEntries.map((entry) => [removeQuestionFillers(entry.question), entry.answer]),
);

const getBigrams = (value) => {
  if (value.length < 2) return new Set([value]);
  return new Set(Array.from({ length: value.length - 1 }, (_, index) => value.slice(index, index + 2)));
};

const getSimilarity = (left, right) => {
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) {
    return 0.4 + (Math.min(left.length, right.length) / Math.max(left.length, right.length)) * 0.6;
  }

  const leftBigrams = getBigrams(left);
  const rightBigrams = getBigrams(right);
  let shared = 0;
  leftBigrams.forEach((bigram) => {
    if (rightBigrams.has(bigram)) shared += 1;
  });
  return (2 * shared) / (leftBigrams.size + rightBigrams.size);
};

const isExactInternshipTimeQuestion = (question) => {
  const mentionsInternship = /(实习|小红书|蓝标|蓝色光标)/.test(question);
  const requestsExactTime = /(几月|哪月|月份|起止|日期|哪天|什么时候开始|什么时候结束|何时开始|何时结束|从什么时候到什么时候)/.test(question);
  return mentionsInternship && requestsExactTime;
};

const isBlockedQuestion = (question) =>
  /(工资|薪资|薪酬|报价|多少钱|商业条款|合作条款|未公开|未上线.*细节|政治|宗教|民族|法律建议|法律咨询|医疗建议|医疗咨询|投资建议|投资咨询|别人.*联系方式|他人.*联系方式|住址|身份证)/.test(question);

const pickFallback = (question) => {
  const available = fallbackAnswers.slice(0, 3);
  if (!available.length) return "这个问题暂时没有公开答案。";
  const hash = Array.from(question).reduce((total, character) => total + character.codePointAt(0), 0);
  return available[hash % available.length];
};

const SIGN_TOPICS = {
  dialect: "方言万花筒",
  graduation: "毕业设计 / 悬丝自诊",
  burger: "秘制汉堡",
  zine: "ZINE",
};

const appendBubble = (text, type = "bot") => {
  if (!chatThread) return;
  const bubble = document.createElement("div");
  bubble.className = `bubble ${type}`;
  bubble.textContent = text;
  chatThread.append(bubble);
  chatThread.scrollTop = chatThread.scrollHeight;
};

const getAnswer = (question) => {
  const normalized = removeQuestionFillers(question);

  if (isExactInternshipTimeQuestion(normalized)) {
    return fallbackAnswers[3] || answerByQuestion.get(removeQuestionFillers("你什么时候开始实习的？/ 几月到几月？"));
  }
  if (isBlockedQuestion(normalized)) return fallbackAnswers[1] || pickFallback(normalized);

  const mappedTarget = mappedQuestions.get(normalized);
  if (mappedTarget === "FALLBACK_TIME") return fallbackAnswers[3] || pickFallback(normalized);
  if (mappedTarget) {
    const mappedAnswer = answerByQuestion.get(removeQuestionFillers(mappedTarget));
    if (mappedAnswer) return mappedAnswer;
  }

  const bestMatch = questionCandidates.reduce(
    (best, candidate) => {
      const score = getSimilarity(normalized, candidate.normalized);
      return score > best.score ? { ...candidate, score } : best;
    },
    { answer: "", score: 0 },
  );

  return bestMatch.score >= 0.64 ? bestMatch.answer : pickFallback(normalized);
};

const submitQuestion = (question) => {
  const trimmed = question.trim();
  if (!trimmed) return;

  appendBubble(trimmed, "visitor");
  if (submitButton) submitButton.disabled = true;
  window.setTimeout(() => {
    appendBubble(getAnswer(trimmed), "bot");
    if (submitButton) submitButton.disabled = false;
    questionInput?.focus();
  }, 320);
};

chatForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  submitQuestion(questionInput?.value || "");
  if (questionInput) questionInput.value = "";
});

quickQuestionButtons.forEach((button) => {
  button.addEventListener("click", () => submitQuestion(button.dataset.question || button.textContent || ""));
});

signButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const topic = SIGN_TOPICS[button.dataset.topic] || "方言万花筒";
    document.querySelector(".chat-scene")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => submitQuestion(`介绍一下${topic}`), 520);
  });
});
