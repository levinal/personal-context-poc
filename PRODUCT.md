# Personal Context — Product Requirements

Date: October 8, 2026

Status: Draft for validating the problem and value with users. The target audience, initial use case, and numerical targets below are research proposals, not validated decisions.

Companion document: [Implementation plan](PLAN.md). This document defines the problem, desired outcome, and validation approach; the implementation plan defines how to build it. This document does not authorize implementation beyond the approved milestone.

## 1. Why this product exists

When someone asks an AI assistant for help, the quality of that help also depends on personal context relevant to the request: previous experience, preferences, constraints, and changes over time. That context may be scattered across conversations, photos, and documents, and some of it may never have been stated explicitly.

**Problem hypothesis:** People who use AI assistants for recurring tasks spend time repeating background information, receive generic recommendations, or need to correct mistaken assumptions. We do not yet have research showing how widespread this problem is, who experiences it most strongly, or whether keeping personal information entirely local would make them willing to use such a product.

**Desired outcome:** Users receive help that better fits their task and circumstances, repeat less background information, and can understand and correct the context used to help them.

**Value proposition to test:** Turn information the user selects locally into relevant personal context they can inspect, correct, and use for a specific task, while keeping all personal information on their device and never sharing it with third parties.

**Core product commitment:** Personalization without surrendering personal information. Local storage alone is insufficient: source material, analysis, derived context, and the assistant interaction that uses it must all stay local. This is a firm product requirement; its value to users and the quality achievable under this constraint still need validation.

## 2. Target users

Proposed initial audience: individuals who regularly use AI assistants for planning and decision-making and feel they need to explain their background repeatedly. The first experiment will focus on people planning a trip who have photos from previous trips that they are willing to select for local processing. Include people who avoid cloud personalization because they do not want to disclose personal information.

Pilot recruitment criteria:

- The participant is planning a real trip or can describe a concrete planning task.
- They have used an AI assistant and can describe a situation where personal context was missing.
- They are willing to select a small photo collection and review what can and cannot be inferred from it.

The user owns the information and approves the context. A locally running AI assistant consumes context approved for the task. Approval selects what the assistant may use locally; it does not authorize third-party disclosure. There is no defined enterprise buyer or validated business model at this stage.

The initial product is not intended for medical, financial, legal, or employment decisions, or for evaluating other people.

## 3. The gap and alternatives to evaluate

The proposed gap is the combination of task relevance, clear sources, a distinction between evidence and inference, freshness, user control, and an entirely local personal-data lifecycle with no third-party disclosure. This is a differentiation hypothesis; this document does not claim that existing solutions lack these capabilities. We need to evaluate the alternatives participants actually use.

| Alternative to evaluate | What it lets the user do | Research question |
| --- | --- | --- |
| Explain their background in every request | Choose exactly what is relevant now | How much time and effort does this take, and what gets left out? |
| Maintain a personal profile or standing instructions | Reuse context they have written explicitly | Does this already solve most of the problem with less effort? |
| Use their existing assistant's memory | Rely on context from previous conversations | What is actually missing in sources, correction, freshness, or reuse? |
| Attach photos or documents to a request | Provide direct evidence for the task | Is there a benefit to retaining approved context for another task? |
| Use the proposed Personal Context product | Review context derived from selected information and apply it to a task | Does useful personalization without third-party disclosure justify the selection and review effort? |

If a short manual profile provides the same benefit with less effort, continuing with photo-based inference for this use case requires a demonstrable additional advantage.

### 3.1 Existing market solutions

Research date: October 8, 2026. This is a focused review of official documentation, not an exhaustive market survey or a hands-on benchmark. Availability can vary by account, plan, region, and product version; verify eligibility before a pilot. The capabilities below are documented by their vendors. The comparisons and proposed opportunities are our interpretation.

Our current implementation is a local photo-ingestion foundation with mock observations. The proposed review, correction, personal inference, and local assistant-integration experiences below are future product requirements, not capabilities we already offer.

| Solution and category | Documented capabilities and overlap | Difference from our proposed product | Implication for this project |
| --- | --- | --- | --- |
| **ChatGPT memory; adjacent local Codex memory** — assistant memory | ChatGPT carries context across chats and exposes memory settings. Codex also has a separate local memory store with chat controls and supporting evidence from prior work. [Official memory documentation](https://learn.chatgpt.com/docs/customization/memories). | Our proposed starting workflow turns a user-selected photo collection into reviewed context for a specific task, with reuse across locally running assistants. The no-disclosure requirement covers processing and task use, not only the memory store. Today we only ingest files and produce mock observations. | A local memory store does not establish that the full assistant interaction stays local. Test the full data flow as well as review usability; do not claim that local storage alone is unique. |
| **Claude memory** — assistant memory and migration | Users can review memory entries, request changes or removal, and import or export memory between providers. Anthropic describes memory imports as experimental. [Official import/export documentation](https://support.claude.com/en/articles/12123587-import-and-export-your-memory-from-claude). | We propose preserving selected source evidence alongside observations and user-approved context, for use by local assistants without sending personal information to a provider. Text-based memory migration already addresses part of the portability need. | Do not claim that memory portability or editing is missing from the market. Test whether retaining evidence and corrections locally provides value beyond a transferred text profile; moving personal context into a hosted service would violate our requirement. |
| **Google Personal Intelligence in Gemini and AI Mode in Search** — personalization from connected services | Gemini can use connected Google services, including Gmail and Photos, with permission. AI Mode documents tailored travel suggestions using email bookings and photo memories, opt-in connections, and follow-up corrections. [Gemini overview](https://blog.google/innovation-and-ai/products/gemini-app/personal-intelligence-nano-banana-us-expansion/), [AI Mode example and controls](https://blog.google/products-and-platforms/products/search/personal-intelligence-ai-mode-search/). | Our requirement is that selected photos, their analysis, derived context, and subsequent assistant use stay on the user's device without third-party disclosure. We also separate observations, inferences, and user statements, and aim for reuse across local assistants. User benefit remains unproven. | This is a direct competitor to the proposed use case. Personalized travel help from photos is already documented. Evaluate whether no-disclosure personalization is valuable to users who would not connect personal sources to a hosted assistant, and measure the quality and effort tradeoff. |
| **Google Photos / Ask Photos** — photo understanding and assistance | Ask Photos retrieves photos and information from a library; the Ask button supports questions about an image. Google also documents suggestions for activities based on the gallery. [Official examples](https://blog.google/products-and-platforms/products/photos/ask-button-ask-photos-tips/). | Our intended output is reviewed context for a local planning task, with no personal information sent for external analysis or assistant use. The current mock processor does not perform image understanding. | Photo understanding and photo-based suggestions are not sufficient differentiation. Compare a direct Ask Photos answer with the proposed local review-and-reuse workflow using synthetic material; assess privacy preference separately. |
| **Mem0** — memory platform for AI applications | Mem0 provides persistent agent memory across sessions and tools. Its open-source edition can run on the developer's infrastructure with configurable components; self-hosting does not by itself mean every processing step stays local. [Product overview](https://docs.mem0.ai/introduction), [self-hosted offering](https://docs.mem0.ai/open-source/overview). | Our product hypothesis concerns the individual's workflow for choosing evidence, reviewing personal interpretations, and approving context for a task. Mem0 is also a potential component rather than only a competitor, provided every processing component can meet the no-disclosure requirement. | Persistent memory, provider choice, and self-hosting are established offerings. Evaluate reuse before expanding our own memory capabilities; decide based on user requirements and verified data flows. Self-hosted storage with external analysis would not qualify. |
| **Zep** — context platform for AI agents | Zep retains user context over time and retrieves it for agents. It documents associations between derived information and source episodes, enabling source traceability. [Agent memory](https://help.getzep.com/v3/agent-memory-solution), [source traceability](https://help.getzep.com/v3/source-traceability). | We propose an individual-facing experience for reviewing selected photo evidence and approving personal context. Temporal context and evidence traceability already overlap with Zep's documented offering. | “Evidence-backed context” alone is not a defensible distinction. An existing context product is a candidate only if its deployment and processing can satisfy the no-disclosure requirement. Source traceability alone does not establish that. |
| **Immich** — self-hosted photo management | Immich offers self-hosted photo management and contextual image search, with filters for metadata such as location and time. [Product site](https://immich.app/), [search documentation](https://docs.immich.app/features/searching/). | Our intended outcome is context that improves an assistant's task, beyond finding photos. We do not aim to replace a full photo library. Immich is an important comparison for local control; our proposed distinction is the reviewed context and local assistant workflow. | Local control and semantic photo retrieval already have alternatives. Test whether finding relevant photos and providing them directly to a local assistant is sufficient before adding a separate context-review process. |

A difference in documented emphasis is not proof that a competitor lacks a capability. We have not verified complete feature coverage, deletion behavior, inference quality, or correction persistence for these products. The no-disclosure boundary is our explicit product requirement, not a verified privacy ranking of competitors or proof of uniqueness. No measured quality or cost advantage is claimed.

### 3.2 Proposed positioning and what remains unproven

**Positioning hypothesis:** A personal context workspace that delivers useful personalization while keeping all personal information local and never sharing it with third parties. Individuals select evidence, review and correct interpretations, and choose what a local assistant may use for a task.

The primary proposed advantage is useful personalization without third-party disclosure, supported by an inspectable review experience:

- **Review before reuse:** Make the transition from visible source content to a personal inference explicit, and let the user decide whether that inference should be reused. Test whether this improves understanding and trust without adding excessive review effort.
- **Corrections that travel with context:** Preserve an explicit correction and its supporting evidence when context is reused in another task or locally running assistant. This goes beyond merely copying profile text as a product goal, but reuse across local assistants is not implemented or validated.
- **Deliberate task selection:** Show the exact context proposed for a task and let the user remove details before local use. Compare this with controls already available in the participant's assistant.
- **All personal information stays local:** Store and process source material, observations, inferred preferences, corrections, and task context on the user's device. Do not send them to external AI providers, hosted assistants, analytics services, or other third parties. This remains mandatory across future milestones. Third-party software may run locally without receiving the data; the boundary concerns disclosure, not who authored the software. Local alternatives exist, so the specific combination and user benefit must still be tested.

The market review establishes substantial overlap with our vision. It does not establish an unmet need. The pilot must demonstrate useful help within the no-disclosure boundary and a reason to choose it over local alternatives. A preference for privacy may justify a quality or speed tradeoff; measure that explicitly rather than assuming the product must outperform every hosted assistant. If users prefer an existing product or a manual profile, we should narrow the idea, integrate with an existing solution, or stop this direction.

### 3.3 Comparison tasks for the pilot

Use synthetic, nonpersonal information for hosted-product comparisons. Personal pilot material stays in the local workflow and is never uploaded to a competitor for benchmarking. Use the same information and planning constraints wherever products allow it. Record any difference in source access or setup rather than treating unequal inputs as a fair quality comparison.

| Comparison task | What to observe |
| --- | --- |
| Plan a trip using prior travel information | Relevance of the result, repeated questions, unsupported assumptions, and total preparation time. Compare with an eligible personalized assistant, especially Google's documented photo-based use case. |
| Inspect a proposed personal inference | Can the user find the supporting evidence and distinguish source content from an inference and an explicit statement? |
| Reject an inference and repeat the task | Does the correction persist, and does the rejected interpretation return? |
| Reuse approved context with another local assistant | What survives: statements, sources, uncertainty, dates, and corrections? How much manual work is required? |
| Verify the no-disclosure boundary | Check network activity, local storage, logs, and any integrated assistant throughout import, analysis, retrieval, and task use. The personal workflow must work with outbound network access blocked after setup. |
| Remove a source and request help again | Does unsupported context stop being used? Evaluate actual behavior rather than relying on a settings label. |

Consumer assistants and photo products are user-workflow baselines. Mem0 and Zep are also build-versus-reuse candidates and require a separate fit evaluation; a consumer task benchmark alone cannot establish whether their underlying services meet our requirements.

## 4. Initial use case: trip planning

**User job:** “When I plan another trip, help me account for the experience and preferences I have already recorded locally, without making me reconstruct everything, deciding what I like on my behalf, or sending my personal information to a third party.”

Before using the product: the user repeatedly describes where they have been, what they enjoyed, and what they do not want to repeat. Missing information may lead to repeated questions or suggestions the user must filter out.

After using the product, if the hypothesis holds: the user selects information, reviews the proposed context, and approves only what is relevant to the planning request. The assistant uses it to ask focused questions and suggest more suitable options.

Hypothetical example:

- Evidence: several selected photos appear to have been taken in Japan. The identification may be wrong, or someone else may have taken the photos.
- Inference to review: the user may have previous experience traveling in Japan. Confirmation is required; the photos do not prove they visited.
- Explicit information: the user says, “I visited Japan in 2024, enjoyed the food, and want more nature on my next trip.”
- Use in the task: the assistant accounts for that statement and asks which regions they have already visited, rather than concluding from photos that they “love Japan.”

Constraints such as budget, dates, accessibility, and travel companions are collected explicitly for the task. Photos do not replace them.

## 5. Why start with photos

Photos are the starting point chosen in the existing plan: we can examine a small collection selected by the user and show the evidence behind a result. They may contribute information about visible places and activities.

However, photos are a partial and sometimes misleading sample. A photo of an activity does not prove a preference; several photos from one event are not several independent events. Dates, locations, or the photographer's identity may be unknown. Photos are therefore a source to evaluate, not proof that the right product must start with them.

The experiment must establish whether visual information adds value beyond a short conversation or manual profile. A different starting source should be considered if research shows greater value.

## 6. Target user experience for the value experiment

1. **Define the task:** The user states the planning request and current constraints.
2. **Select information:** The user chooses a limited collection, sees what is selected, and understands that selection, processing, and use remain local.
3. **Review results:** The user sees observations and inferences, their evidence, and their limitations. A valid result may contain no useful context.
4. **Approve and correct:** The user can confirm, correct, reject, or mark information as outdated.
5. **Select context for the task:** The user sees a summary of the context that will be provided to the local assistant and can remove details.
6. **Receive help:** A locally running assistant uses the selected context and identifies uncertainty or the need for another question.
7. **Revisit:** The user can inspect what the help relied on and change the context before the next task.

This describes the target experience for the value experiment. The complete flow does not exist in the current version.

## 7. Product requirements and acceptance criteria

These requirements must be met before the full value experiment. Some can be tested through a guided manual process before investing in a complete product.

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| P1 | Informed information selection | The user can inspect the selected collection and remove items before processing. The collection is not expanded automatically. |
| P2 | Sources for every conclusion | The user can open the evidence behind each derived observation or inference. Explicit information is labeled as a user statement. |
| P3 | Distinguish information types | The user can distinguish what appears in the source, what the system infers, and what they explicitly confirmed. |
| P4 | Visible uncertainty | Uncertain identifications are labeled. When evidence is insufficient, the system says so rather than filling in a story. Confidence is not presented as a guarantee of correctness. |
| P5 | Temporal context | The source date, when known, and the inference creation date are shown. Missing dates are labeled as unknown. Old information is not automatically presented as a current preference. |
| P6 | User-controlled correction | An explicit correction takes precedence over a conflicting inference. A rejected inference does not silently return when the same evidence is processed again. |
| P7 | Task-specific local use | The user sees the context selected for the task before a local assistant uses it. Irrelevant or removed details are excluded, and no personal context is sent to a hosted assistant. |
| P8 | Deletion and stopping use | The user can remove a source or conclusion. Conclusions that depend on a removed source are deleted or reevaluated against the remaining evidence. Unsupported results stop being used as context. |
| P9 | Clear progress and failure reporting | The user knows what has been processed, what failed, and what remains. A retry is not presented as new independent evidence for the same information. |
| P10 | Inference boundaries | The product does not infer other people's identities, sensitive traits, or unsupported personal claims from photos. A violation disqualifies the experiment result pending review and correction. |
| P11 | No third-party disclosure | Source photos, personal metadata, observations, derived context, corrections, and personal task inputs and outputs stay on the user's device. The complete personal workflow runs with outbound access blocked after setup, and data-flow checks find no personal information sent externally, including through logs or telemetry. External AI fallback is not allowed. |

Local deletion scope and completion times must be defined before the experiment. If a user independently copies information outside the product, the product cannot control or erase that copy; this does not create an external-sharing path within the product.

## 8. Privacy, trust, and control

**All personal information stays local and is not shared with third parties.** This covers original material and every personal representation derived from it, including metadata, observations, inferred preferences, summaries, future embeddings, corrections, and personal task inputs and outputs.

- Storage, image analysis, inference, retrieval, and assistant use must run on the user's device. Local storage followed by a remote model request does not satisfy the requirement.
- No personal information may leave through external AI calls, hosted assistants, analytics, crash reports, logs, automatic cloud backup, or synchronization provided by the product. The product must not silently fall back to an external service.
- Setup may download software or model files without sending personal information. After setup, the personal workflow must remain usable with outbound network access blocked.
- Approval controls what a local assistant may use. It is not permission to disclose personal information externally. Connecting to a hosted assistant would require a separate, explicitly reconsidered product scope and could not retain the same no-disclosure promise.
- Photos may include other people. The pilot is not intended to build profiles of them; synthetic material or collections that do not expose them should be preferred. Local storage still requires access and deletion controls.
- Personal information, photos, processing results, and credentials must not be included in the code repository or public examples. Public code does not authorize publishing personal data.
- The promise concerns information handled by this product. It cannot erase material a user previously stored with another provider or prevent independent copies or device-level backups configured outside the product. These boundaries must be explained clearly.

**Decisions needed before a personal-data pilot:** Local retention and deletion rules, local access controls, storage and backup boundaries, and how to verify the full workflow sends no personal information externally. The no-disclosure policy is settled; demonstrating compliance across future capabilities remains work to do.

**Alignment with the implementation plan:** `PLAN.md` anticipates a real vision provider and a later cloud photo adapter. Those milestones must be reviewed against this requirement before implementation: personal analysis needs a local provider, and any source integration must be assessed for outbound personal information. The document update does not change the code, implement later milestones, or certify a future workflow that has not been built.

## 9. Scope and current status

| Stage | What it tests | What it does not prove |
| --- | --- | --- |
| Milestone 1 — implemented | Local photos can be imported, file information and mock results can be stored, provenance can be inspected, and reruns do not create duplicates. | Image understanding, correctness of personal conclusions, a correction experience, or user value. |
| Problem and value experiment — proposed | Whether context improves a planning task and whether the user values keeping information local enough to invest the selection and review effort. A guided manual process can be the starting point. | Product-market fit, sustained use, or support for every area of life. |
| Product expansion — future | To be determined by research results and approval of a new scope. | Writing this document does not authorize implementation. |

Outside the first experiment: bulk collection of an entire information library, many simultaneous sources, making bookings, sending messages, automatic decisions on the user's behalf, a multi-user product, and a comprehensive personal profile. None is needed to test the initial hypothesis.

## 10. Validation plan and success metrics

### A. Validate the problem before expanding development

Proposal: conduct 5–8 interviews with people in the target audience. Ask for examples of real tasks, repeated explanations, unsuitable recommendations, and current workarounds. Measure existing behavior before presenting a solution.

Also investigate willingness to select information, review results, and reuse context locally. Ask whether avoiding third-party disclosure changes their willingness to use the product. Enthusiasm for the idea alone does not demonstrate a need.

### B. Run a small comparative experiment

Proposal: a pilot with 5–8 users, 20–50 selected photos per participant, and two planning tasks of similar difficulty. These sample sizes support qualitative learning, not statistical proof.

For the local personal-data pilot, compare a request without retained context, a short manual profile, and locally derived context in the same local assistant where possible. Run a separate synthetic-data benchmark to compare four conditions: a request without retained context; the same task with a short manual profile; the participant's existing personalized assistant with its available memory or connected sources; and the same task with context derived from selected information and reviewed by the user. For comparisons within one assistant, keep the assistant, constraints, and request detail as consistent as possible. For comparisons across products, record differences in assistant capability and available sources, and treat the result as a workflow comparison rather than proof that the context layer caused the difference. Balance the order of conditions. Use the tasks in Section 3.3 to evaluate control and reuse. If preparation is manual, label it as such rather than presenting it as existing automation.

| Metric | Measurement | Proposed initial target |
| --- | --- | --- |
| Task value | Rate relevance and usefulness from 1–5 for each result, before revealing the experiment condition where possible. | Most participants prefer the local context workflow over a local manual profile and can explain a concrete benefit. Record separately whether they prefer it to a hosted alternative when considering privacy, quality, speed, and effort together. |
| Total effort | Time selection, profile preparation, review, correction, and repeated explanations. Separate initial use from subsequent use. | At least a 30% median reduction in repeated explanation time on subsequent use, with no increase in total effort compared with the manual alternative. |
| Context quality | The user labels each item as correct, incorrect, irrelevant, or indeterminate. | At least 80% of proposed context items are both correct and relevant. Also report the number of useful items produced separately. |
| Sources and evidence support | Check every personal claim against its source and user statements. | Every derived claim has accessible evidence; zero unsupported personal claims are presented as fact. |
| No third-party disclosure | Exercise the full personal workflow with outbound access blocked after setup; inspect data flows, local outputs, and integration configuration. | Zero personal information leaves the device. A violation fails the pilot regardless of usefulness. |
| Privacy value | Ask users to choose between the local workflow and hosted alternatives, documenting the reasons and acceptable quality or speed tradeoffs. | Report how many choose local operation specifically because information is not disclosed; use this to validate the target audience rather than claiming universal preference. |
| User control | Run a planned rejection, correction, and source-removal scenario, followed by another task. | All corrections and removals are honored on subsequent use. |
| Willingness to reuse | Offer another task at an agreed time and record actual participation. | At least 3 of the first 5 participants choose to try again. This is only a learning signal. |

These are proposed decision thresholds to approve before the experiment, not measured results. Report failures and the number of items and users evaluated. Duplicate photos must not be counted as independent evidence to improve metrics.

### C. Decide after the experiment

- **Continue:** A recurring pain is established, context adds value beyond a local manual profile, the no-disclosure requirement is met, and users have a concrete reason to choose it over existing alternatives, including privacy where relevant. Define and approve the next experiment's scope.
- **Narrow or change direction:** A personal profile has value, but photos add too little or review takes too much effort. Evaluate explicit input or another source.
- **Stop this direction:** There is no significant pain, the simpler alternative is sufficient, or users do not accept the required local setup and review effort. Pause personal-data testing immediately if the no-disclosure boundary fails.

## 11. Risks that could invalidate the value proposition

| Risk | What to test |
| --- | --- |
| Photos do not represent the user's life | Can the user identify and correct generalizations, and is useful context left after review? |
| A temporary preference becomes a permanent “fact” | Do time, uncertainty, and a recent explicit preference change how context is used? |
| Review costs more than explaining manually | Measure all preparation and correction time, including when no useful result is produced. |
| Numbers create excessive confidence | Can the user distinguish what is established from what is inferred, without relying solely on a confidence score? |
| The demo succeeds only through cherry-picked examples | Include varied collections, irrelevant items, and cases with insufficient evidence, and report them. |
| Local processing is too slow or less capable | Measure usefulness, response time, and setup effort using local models; ask whether the privacy benefit is worth the tradeoff. Do not resolve failures by silently sending data externally. |
| Personal information leaks through an integration or diagnostic path | Verify the complete workflow, including assistant use, logs, telemetry, and backups. Local database storage alone is insufficient evidence. |
| An existing alternative provides the same benefit | Compare against the participant's actual workflow before deciding to invest further. |

## 12. Open questions and required decisions

| Open question | How to resolve it | When an answer is needed |
| --- | --- | --- |
| Who experiences frequent, significant pain? | Interviews and examples of previous tasks. | Before expanding product scope. |
| Is trip planning the right initial use case? | Compare frequency, pain, and demand for local privacy against use cases participants raise. | Before recruiting for the value pilot. |
| What is missing from participants' alternatives? | Use the documented market review in Section 3.1 to guide hands-on tests of the profiles, memory features, and connected-source assistants they already use. | Before claiming differentiation. |
| Which photo-derived context is actually useful? | User labeling and comparison with a manual profile. | During the pilot. |
| Is this a standalone product or a service for an existing assistant? | Evaluate locally running assistants and the friction of keeping personal task use entirely local. Hosted consumption conflicts with the current requirement. | Before choosing a broader product experience. |
| How do users understand and correct information? | Test confirmation, rejection, contradiction, and outdated information scenarios. | Before relying on conclusions repeatedly. |
| How will entirely local processing, retention, and deletion be delivered and verified? | Select local processing options, define local retention and deletion, and verify that no personal information leaves through any part of the workflow. | Before using personal information in the pilot. |
| Which users value no third-party disclosure enough to accept local setup and possible quality tradeoffs? | Recruitment interviews and observed choices between local and hosted workflows using synthetic comparisons. | Before settling the target audience. |
| Should the code repository be public? | The repository owner decides the purpose of publication and what is appropriate to share. | Before publishing further material; this document does not change visibility. |
| Who owns the research, and what are the schedule and budget? | The project owner assigns responsibility, dates, and an investment limit. | Before research begins. |
| Is there willingness to pay, and for what? | After demonstrating value, investigate alternatives and pricing with users. | Before investing in a commercial product. |

## 13. Recommended next action

Confirm or revise the target audience and initial use case, then conduct the problem interviews. In parallel, prepare a synthetic example of information selection, evidence review, and correction. Implementing another milestone is not necessary to start learning whether the proposed problem and value are real.
