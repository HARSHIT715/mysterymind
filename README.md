<div align="center">

```
 __  __ __   __ ___ _____ ___ ___ __   __ __  __ ___ _  _ ___
|  \/  |\ \ / // __|_   _| __| _ \\ \ / /|  \/  |_ _| \| |   \
| |\/| | \ V / \__ \ | | | _||   / \ V / | |\/| || || .` | |) |
|_|  |_|  |_|  |___/ |_| |___|_|_\  |_|  |_|  |_|___|_|\_|___/
```

# 🕵️ MysteryMind: AI Logic Detective

### *Every clue has a story. Every conclusion needs a reason.*

**A rule-based symbolic AI that solves fictional crimes with real unification and forward chaining.**

[![Live Demo](https://img.shields.io/badge/🔴_LIVE_DEMO-open_the_case_file-F2B33D?style=for-the-badge&labelColor=0A0910)](https://mysterymind-static.onrender.com/)
[![AI](https://img.shields.io/badge/AI-Symbolic_Reasoning-FF4D6D?style=for-the-badge&labelColor=0A0910)](#-how-the-brain-works)
[![Unification](https://img.shields.io/badge/Algorithm-Unification-2EE6C5?style=for-the-badge&labelColor=0A0910)](#-unification-in-action)

![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F2B33D?style=flat-square&logo=javascript&logoColor=black)
![No Backend](https://img.shields.io/badge/backend-none-7CC4E8?style=flat-square)
![No API Keys](https://img.shields.io/badge/API_keys-zero-5FD7A0?style=flat-square)
![No LLM](https://img.shields.io/badge/LLM-not_used-B88CFF?style=flat-square)
![Status](https://img.shields.io/badge/status-case_open-FF8AC4?style=flat-square)

**[🎬 Live Demo](#-live-demo)** · **[🧠 How It Works](#-how-the-brain-works)** · **[⚡ Quick Start](#-quick-start)** · **[🚀 Deploy](#-deploy-it)** · **[📁 Structure](#-project-structure)**

</div>

---

## 🔍 What is this?

**MysteryMind** is an interactive detective workspace built for an **AI & Expert Systems (AIES)** mini project. It extends the classic **Unification Algorithm** into a full investigation platform.

You give it **facts**, **clues** and **logical rules**. It uses **structural unification + forward chaining** to derive conclusions, and then it shows you *exactly* how it got there, step by step.

> 🧪 **It is not a chatbot.** There is no language model, no API and no server. Every conclusion is computed in your browser by a symbolic reasoning engine you can read in `src/engine.js`.

---

## ✨ Features

| | Feature | What it does |
|---|---|---|
| 🧩 | **Real unification engine** | Structural matching with a substitution map, occurs check, arity check and nested terms |
| ⛓️ | **Forward-chaining inference** | Multi-step rules, one consistent substitution across conditions, duplicate prevention, fixpoint detection |
| 🔬 | **Explainable AI** | Every derived fact shows its rule, matched facts, substitution, what it proves and what it does *not* prove |
| 🕹️ | **Step-through reasoning lab** | Watch the engine try each candidate fact and see `X → amit` happen live |
| 🗂️ | **5 built-in fictional cases** | Different reasoning patterns: access, permissions, attribution, causality, routes |
| 🛠️ | **Case Builder** | Create your **own** case with people, evidence, facts and rules, then run the engine on it |
| 🧪 | **Custom Lab** | Type your own terms, facts and rules. Add and remove facts and rerun |
| 🔎 | **Global search (Ctrl+K)** | Searches cases, evidence, suspects, statements, timeline and facts, plus structured quick queries |
| 📌 | **Evidence board** | Zoomable corkboard with red-string links built only from real data |
| 🕰️ | **Timeline** | Conflicts and missing information are flagged only where the record supports it |
| 📄 | **Report generator** | One-click investigation report from the actual inference results |
| 🎨 | **Noir detective UI** | Police-tape, thumbtacks, polaroids, spotlight and film grain |

---

## 🎬 Live Demo

🔗 **https://mysterymind-static.onrender.com/**

> **30-second tour**
> 1. Click **Run AI Reasoning Demo** on the first screen.
> 2. Hit **Next Step** and watch rule `R1` unify `has_key(X, lab)` with `has_key(amit,
