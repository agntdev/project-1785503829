# منشور علمي مفاجئ — Bot specification

**Archetype:** content

**Voice:** neutral and engaging — write every user-facing message, button label, error, and empty state in this voice.

يُنتج منشورًا علميًا مفاجئًا موجزًا (3-5 سطور) بلغة الضاد الفصحى بأسلوب مألوف، يتضمن حقيقة علمية مذهلة دون مصادر أو دعوات للعمل، مُتبعًا بجدول تقييم 8 معايير (1-10) في نفس المحادثة.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- الجمهور العام في العالم العربي
- قراء مهتمون بالعلوم

## Success criteria

- إظهار المنشور النهائي مباشرة بعد إدخال المستخدم
- إظهار جدول التقييم المطلوب

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — فتح القائمة الرئيسية وطرح السؤال الأول
- **إنشاء المنشور** (button, actor: user, callback: generate:post) — إنتاج المنشور النهائي والجدول التقييمي

## Flows

### إنشاء المنشور
_Trigger:_ /start أو زر الإنشاء

1. طرح السؤال الأول (ما موضوع المنشور؟)
2. توليد المنشور النهائي (3-5 سطور) بلغة الضاد الفصحى
3. إظهار جدول التقييم المكون من 8 معايير

_Data touched:_ Post, EvaluationTable

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **Post** _(retention: session)_ — المنشور النهائي الموجز بلغة الضاد الفصحى
  - fields: المحتوى النصي, عدد السطور
- **EvaluationTable** _(retention: session)_ — جدول تقييم 8 معايير (1-10) مع أسباب مختصرة
  - fields: المعايير, النقاط, الأسباب

## Integrations

- **Telegram** (required) — Bot API messaging
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- تحديد موضوع المنشور (من خلال إدخال المستخدم الأولي)

## Permissions & privacy

- ال봇 لا يخزن بيانات المستخدم أو يشاركها

## Edge cases

- المحتوى المُدخل يتجاوز الحد الأقصى من السطور
- موضوع المنشور غير واضح أو مبهم

## Required tests

- اختبار أن المنشور النهائي يظهر مباشرة دون رسائل إضافية
- التأكد من أن جدول التقييم يتبع المنشور مباشرة دون فواصل إضافية

## Assumptions

- المستخدم يوفر موضوع المنشور عبر الرد على السؤال الأول
- ال-bot يُنتج المحتوى بالضبط وفق الشروط المذكورة
