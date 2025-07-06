// === [main_app_combined.js] === // 🚀 ULCS Hybrid AI Smart Assistant Master Controller // 🧠 Unified Version: Ultra Core X + Fusion V3 + LocalModel Fallback // ⚙️ Features: Offline/Online, Notification, Suggestion, Emotion, Memory, Web Search, Scheduler, Smart Prompt Handler

const path = require("path"); const fs = require("fs"); const skillRegistry = require("./skill_builder/skill_registry"); const { detectLanguage, translateText } = require("./ai_extensions/multi_lang_parser"); const { extractIntent, extractSubTasks } = require("./ai_extensions/intent_extractor"); const { generateCodeOffline } = require("./offline_engine/ulcs_offline_generator"); const { notifyUser } = require("./realtime/notification_engine"); const { suggestSkills } = require("./ai_extensions/skill_suggester"); const { logActivity, summarizeAnalytics } = require("./logger/activity_logger"); const webTool = require("./tools/web_agent"); const memory = require("./ai_extensions/memory"); const dashboard = require("./ui/cli_web_dashboard"); const localModel = require("./ai_extensions/local_model"); const emotionDetector = require("./ai_extensions/emotion_analyzer"); const scheduler = require("./tools/scheduler_reminder"); const { localModelRespond } = require("./local_model");

// 🔐 Optional: Secure Account/Session Handler const { authenticateUser } = require("./auth/session_handler");

function loadSkillModule(skillKey) { const skillPath = skillRegistry[skillKey]; if (!skillPath) throw new Error(Skill not found: ${skillKey}); return require(path.resolve(skillPath)); }

function findMatchingSkill(intent) { const norm = intent.toLowerCase().replace(/\s+/g, "_"); for (const key in skillRegistry) { if (key.toLowerCase().includes(norm)) return key; } return null; }

async function handleLocally(text) { if (text.length > 800) return await localModel.summarize(text); return await localModel.process(text); }

async function webResearch(query) { const results = await webTool.search(query); const summary = await localModel.summarize(results.map(r => r.snippet).join("\n")); return summary || "❌ No data found."; }

async function autoSuggestAndNotify(userId, input) { const intent = await extractIntent(input); const stats = await dashboard.analyzeSkillUsage(userId, intent); if (stats?.notify) { return 🔔 Suggestion: You've used "${intent}" often. Want to automate it?; } return ""; }

// 🧠 Smart Prompt Developer (New Feature) async function smartPromptExecutor(rawInput, userId = "default_user") { // Allow smart assistant-like execution const lower = rawInput.toLowerCase(); if (lower.includes("remind me")) return await scheduler.schedule(rawInput, userId); if (lower.includes("search") || lower.includes("find info")) return await webResearch(rawInput); if (lower.includes("summarize")) return await localModel.summarize(rawInput); return null; // let normal flow handle }

// 🌐 Unified Command Processor async function handleUserCommand(rawInput, userId = "default_user") { try { console.log(📥 Command received: ${rawInput}); const userLang = await detectLanguage(rawInput); const translated = await translateText(rawInput, "en"); const emotion = await emotionDetector.analyze(rawInput); const memoryTip = await memory.recallContext(userId, translated);

// 🔍 Smart Prompt Logic First
const smartOutput = await smartPromptExecutor(translated, userId);
if (smartOutput) return smartOutput;

// 🔁 Sub-task Handler
const subTasks = await extractSubTasks(translated);
const taskList = subTasks.length > 0 ? subTasks : [translated];
const results = [];

for (const task of taskList) {
  const intent = await extractIntent(task);
  const skillKey = findMatchingSkill(intent);

  if (skillKey) {
    const skillModule = loadSkillModule(skillKey);
    if (typeof skillModule.executeSkill === "function") {
      const result = await skillModule.executeSkill(task, userId);
      results.push(`✅ [${intent}]: ${result}`);
    } else {
      results.push(`❌ No executeSkill() in ${skillKey}`);
    }
  } else {
    // No matching skill — fallback or auto-generate
    const fallback = await localModelRespond(task);
    results.push(fallback);

    const autoTool = await generateCodeOffline(intent);
    results.push(`🛠️ Auto-generated tool for "${intent}" created.`);
  }
}

await logActivity({
  userId,
  rawInput,
  tasks: taskList,
  emotion,
  timestamp: new Date().toISOString(),
});

notifyUser(userId, {
  title: "✅ Command Processed",
  message: `${taskList.length} task(s) completed successfully.`,
});

const suggestions = await suggestSkills(translated);
if (suggestions.length > 0) {
  results.push("💡 Suggested Tools You Might Like:");
  suggestions.forEach((s, i) => results.push(`${i + 1}. ${s}`));
}

const autoTip = await autoSuggestAndNotify(userId, translated);
return results.join("\n\n") + `\n\n🧠 Context: ${memoryTip}\n${autoTip}`;

} catch (err) { console.error("❌ Error in unified main_app:", err.message); return ❌ Error: ${err.message}; } }

// 📊 Dashboard Analytics Export async function getAnalyticsDashboard(userId = "default_user") { return await summarizeAnalytics(userId); }

module.exports = { handleUserCommand, getAnalyticsDashboard };

  
