// === [main_app_combined.js] === // 🚀 ULCS Super Hybrid AI Core (Premium-Level Engine) // 🧠 Offline-First, Dynamic Skill Loader, Voice & Emotion Aware, API Ready

const path = require("path"); const fs = require("fs");

// === Module Requires === const skillRegistry = require("./skills/skill_registry"); const { detectLanguage, translateText } = require("./ai_extensions/multi_lang_parser"); const { extractIntent, extractSubTasks } = require("./ai_extensions/intent_extractor"); const { generateCodeOffline } = require("./offline_engine/ulcs_offline_generator"); const { notifyUser } = require("./realtime/notification_engine"); const { suggestSkills } = require("./ai_extensions/skill_suggester"); const { logActivity, summarizeAnalytics } = require("./logger/activity_logger"); const { analyzeEmotion } = require("./ai_extensions/emotion_analyzer"); const { recallContext } = require("./ai_extensions/memory"); const localModel = require("./ai_extensions/local_model"); const webTool = require("./tools/web_agent"); const scheduler = require("./tools/scheduler_reminder");

// === Utility Functions === function loadSkillModule(skillKey) { const skillPath = skillRegistry[skillKey]; if (!skillPath) throw new Error(Skill not found: ${skillKey}); return require(path.resolve(skillPath)); }

function findMatchingSkill(intent) { const norm = intent.toLowerCase().replace(/\s+/g, "_"); for (const key in skillRegistry) { if (key.toLowerCase().includes(norm)) return key; } return null; }

async function handleLocally(text) { if (text.length > 800) return await localModel.summarize(text); return await localModel.process(text); }

async function webResearch(query) { const results = await webTool.search(query); const summary = await localModel.summarize(results.map(r => r.snippet).join("\n")); return summary || "❌ No data found."; }

// === Primary Command Handler === async function handleUserCommand(rawInput, userId = "default_user") { try { const userLang = await detectLanguage(rawInput); const translated = await translateText(rawInput, "en"); const emotion = analyzeEmotion(rawInput); const memoryTip = await recallContext(userId, translated);

const subTasks = await extractSubTasks(translated);
const taskList = subTasks.length > 0 ? subTasks : [translated];
const results = [];

for (const task of taskList) {
  const intent = await extractIntent(task);

  if (intent.includes("web research")) {
    results.push(await webResearch(task));
    continue;
  }
  if (intent.includes("summarize")) {
    results.push(await localModel.summarize(task));
    continue;
  }
  if (intent.includes("schedule")) {
    const scheduled = await scheduler.schedule(task, userId);
    results.push(scheduled);
    continue;
  }

  const skillKey = findMatchingSkill(intent);
  if (skillKey) {
    const skillModule = loadSkillModule(skillKey);
    if (typeof skillModule.executeSkill === "function") {
      const output = await skillModule.executeSkill(task, userId);
      results.push(`✅ [${intent}]: ${output}`);
    } else {
      results.push(`❌ No executeSkill() in ${skillKey}`);
    }
  } else {
    const autoTool = await generateCodeOffline(intent);
    results.push(`🛠️ Auto-generated tool for "${intent}" created.`);
  }
}

logActivity({ userId, rawInput, tasks: taskList, emotion, timestamp: new Date().toISOString() });
notifyUser(userId, {
  title: "✅ Command Processed",
  message: `${taskList.length} task(s) completed successfully.`
});

const suggestions = await suggestSkills(translated);
if (suggestions.length > 0) {
  results.push("💡 Suggested Tools You Might Like:");
  suggestions.forEach((s, i) => results.push(`${i + 1}. ${s}`));
}

return results.join("\n\n") + `\n\n🧠 Emotion: ${emotion}\n📎 Context: ${memoryTip}`;

} catch (err) { console.error("❌ Error:", err); return ❌ Error: ${err.message}; } }

async function getAnalyticsDashboard(userId = "default_user") { return await summarizeAnalytics(userId); }

// === Vercel API Handler === async function handler(req, res) { if (req.method === "POST") { const { prompt, userId } = req.body || {}; if (!prompt) return res.status(400).json({ error: "Missing prompt" }); const response = await handleUserCommand(prompt, userId); return res.status(200).json({ result: response }); } else { return res.status(405).json({ error: "Method not allowed" }); } }

module.exports = { handleUserCommand, getAnalyticsDashboard, handler };

