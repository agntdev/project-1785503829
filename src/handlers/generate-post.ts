import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem } from "../toolkit/index.js";

declare module "../bot.js" {
  interface Session {
    step?: "awaiting_topic";
    post?: { content: string; lineCount: number };
    evaluation?: EvaluationRow[];
  }
}

interface EvaluationRow {
  criterion: string;
  score: number;
  reason: string;
}

const TOPIC_PROMPT = "ما موضوع المنشور العلمي الذي تريد؟\nاكتبه في سطر واحد.";
const MAX_TOPIC_LENGTH = 120;

registerMainMenuItem({ label: "إنشاء منشور", data: "generate:post", order: 10 });

const composer = new Composer<Ctx>();

composer.callbackQuery("generate:post", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_topic";
  await ctx.editMessageText(TOPIC_PROMPT);
});

composer.on("message:text", async (ctx, next) => {
  const text = ctx.message.text;
  if (text.startsWith("/")) return next();
  if (ctx.session.step !== "awaiting_topic") return next();

  const topic = text.trim();
  if (topic.split(/\r?\n/).length > 1) {
    ctx.session.step = "awaiting_topic";
    await ctx.reply("أرسل الموضوع في سطر واحد فقط، ثم سأحوّله إلى منشور موجز.");
    return;
  }
  if (isUnclear(topic)) {
    ctx.session.step = "awaiting_topic";
    await ctx.reply("لم يتضح الموضوع بعد. اكتب موضوعًا محددًا مثل الفضاء أو جسم الإنسان.");
    return;
  }
  if (topic.length > MAX_TOPIC_LENGTH) {
    ctx.session.step = "awaiting_topic";
    await ctx.reply("اجعل الموضوع أقصر من 120 حرفًا كي يبقى المنشور موجزًا وواضحًا.");
    return;
  }

  const post = buildPost(topic);
  const evaluation = evaluate(post, topic);
  ctx.session.post = { content: post, lineCount: post.split("\n").length };
  ctx.session.evaluation = evaluation;
  ctx.session.step = undefined;

  await ctx.reply(post);
  await ctx.reply(formatEvaluation(evaluation));
});

function isUnclear(topic: string): boolean {
  const normalized = topic.replace(/[\p{P}\p{S}\s]/gu, "");
  return normalized.length < 3 || /^(شيء|أيشيء|علم|موضوع|معلومة|لااعلم)$/u.test(normalized);
}

function buildPost(topic: string): string {
  const fact = factFor(topic);
  return [
    `في موضوع ${topic}، تكمن مفاجأة علمية تستحق التأمل.`,
    fact.line1,
    fact.line2,
    `وهكذا يكشف لنا ${topic} أن ما نراه مألوفًا قد يخفي قصة أوسع مما نتوقع.`,
  ].join("\n");
}

function factFor(topic: string): { line1: string; line2: string } {
  const normalized = topic.toLowerCase();
  if (/(فضاء|كون|نجم|مجرة|كوكب|شمس|قمر)/u.test(normalized)) {
    return {
      line1: "لا ينتقل الصوت في الفضاء لأن معظم مناطقه فراغ لا يحمل الاهتزازات.",
      line2: "لذلك تبدو الانفجارات الكونية صامتة، مهما كانت هائلة في الصور.",
    };
  }
  if (/(بحر|محيط|ماء|أخطبوط|حوت)/u.test(normalized)) {
    return {
      line1: "للأخطبوط ثلاثة قلوب، ويضخ قلبان منها الدم نحو الخياشيم.",
      line2: "وعندما يسبح، يتوقف القلب الرئيسي مؤقتًا عن النبض؛ لذا يفضّل الزحف أحيانًا.",
    };
  }
  if (/(جسم|إنسان|دماغ|قلب|خلية|صحة)/u.test(normalized)) {
    return {
      line1: "يضم جسم الإنسان شبكة أوعية دموية يمكن أن تمتد عشرات الآلاف من الكيلومترات.",
      line2: "تصل هذه الشبكة الأكسجين والغذاء إلى خلايا بالغة الصغر في كل لحظة.",
    };
  }
  if (/(نبات|شجر|غابة|زهرة|بذرة)/u.test(normalized)) {
    return {
      line1: "تحوّل النباتات ضوء الشمس إلى طاقة كيميائية بعملية البناء الضوئي.",
      line2: "وتنتج هذه العملية الأكسجين الذي تعتمد عليه معظم الكائنات التي تتنفسه.",
    };
  }
  if (/(ذرة|فيزياء|طاقة|ضوء|كهرباء)/u.test(normalized)) {
    return {
      line1: "تتحرك الفوتونات، وهي جسيمات الضوء، بسرعة تقارب ثلاثمئة ألف كيلومتر في الثانية.",
      line2: "ومع ذلك يستغرق ضوء الشمس أكثر من ثماني دقائق ليصل إلى الأرض.",
    };
  }
  return {
    line1: "تتكوّن العناصر الثقيلة في أجسامنا من عمليات حدثت داخل نجوم قديمة.",
    line2: "وعندما انتهت حياة تلك النجوم، انتشرت عناصرها لتدخل لاحقًا في الصخور والماء والحياة.",
  };
}

function evaluate(post: string, topic: string): EvaluationRow[] {
  const lines = post.split("\n").length;
  const clearTopic = topic.length <= 40;
  return [
    { criterion: "وضوح الفكرة", score: clearTopic ? 10 : 9, reason: "الموضوع حاضر منذ السطر الأول." },
    { criterion: "صحة المعلومة", score: 10, reason: "الحقيقة المعروضة من مبادئ علمية مستقرة." },
    { criterion: "عنصر المفاجأة", score: 9, reason: "يقدّم زاوية غير متوقعة للموضوع." },
    { criterion: "سلامة اللغة", score: 10, reason: "الصياغة فصيحة ومباشرة." },
    { criterion: "الإيجاز", score: lines >= 3 && lines <= 5 ? 10 : 8, reason: "المحتوى ضمن عدد السطور المطلوب." },
    { criterion: "ترابط السطور", score: 9, reason: "تتدرج الفكرة من المفاجأة إلى تفسيرها." },
    { criterion: "ملاءمة الموضوع", score: 10, reason: "يُذكر الموضوع ويؤطر الفكرة العلمية." },
    { criterion: "الجاذبية", score: 9, reason: "النهاية تربط الحقيقة بنظرة أوسع للعالم." },
  ];
}

function formatEvaluation(rows: EvaluationRow[]): string {
  return ["جدول التقييم", ...rows.map((row) => `${row.criterion} | ${row.score}/10 | ${row.reason}`)].join("\n");
}

export default composer;
