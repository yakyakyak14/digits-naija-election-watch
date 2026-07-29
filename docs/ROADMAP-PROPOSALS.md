# Ten proposals to strengthen DIGITs

Ordered by impact-per-effort. Each entry says what it does, why it matters for a
Nigerian election specifically, and roughly what it costs to build. Nothing here
is implemented yet — the shipped feature set is on `/features`.

---

## 1. Polling-unit tally board with automatic arithmetic auditing

**What.** Aggregate the figures already captured in `observation_checklists` into
a live board at polling-unit → ward → LGA → state level, and run the three
integrity checks automatically on every row: accreditation ≤ registration, votes
cast ≤ accreditation, valid + rejected = total. Surface a ranked list of units
that fail.

**Why it matters.** The data is already being collected and the checks are already
enforced per submission — what is missing is the aggregate view that turns a
hundred individual observations into a statement about a state. This is the single
highest-value thing left to build, and it makes DIGITs quotable by newsrooms.

**Effort.** Medium. One materialised view refreshed on insert, plus a page. No new
data capture.

---

## 2. Parallel Vote Tabulation (PVT) with statistically valid sampling

**What.** Let coordinators define a random sample of polling units, deploy
observers specifically to those, and publish a projected result with a confidence
interval instead of an anecdote count.

**Why it matters.** A curated sample of 300 well-chosen units supports a defensible
national claim; 3,000 self-selected units do not. PVT is the methodology
established observation missions use, and it is the difference between "we saw
irregularities" and "turnout in this state is outside the plausible range."

**Effort.** Medium-high. Sampling frame, weighting, and a projection engine — plus
statistical review before anything is published.

---

## 3. Observer panic beacon with live coordinator dispatch

**What.** A one-touch distress control in the observer's app that streams live
coordinates and identity to the Command Center, opens a dedicated incident, and
pages the assigned supervisor.

**Why it matters.** Module 5 already trains observers to trigger a beacon early.
The training is honest only once the beacon exists. Observer safety is also the
constraint on recruitment: people volunteer when they believe someone is watching
their back.

**Effort.** Low-medium. Deployment rows already carry supervisor contacts;
`incident_reports` already has a critical path. Needs a persistent location
channel and a dispatch view.

---

## 4. Offline-first capture queue

**What.** When the network fails, hold the captured clip, its metadata and its
hash in IndexedDB, and upload when connectivity returns — with the original
capture timestamp and coordinates preserved and the queue visible to the reporter.

**Why it matters.** Networks are congested or absent at exactly the moments worth
recording. Right now a failed upload loses the evidence. This is the change that
most increases the amount of evidence that survives election day.

**Effort.** Medium. IndexedDB queue plus a background sync worker. The service
worker already refuses to cache election data, so the queue must be explicit
rather than incidental.

---

## 5. Duplicate and manipulation detection on incoming evidence

**What.** Perceptual hashing on upload to catch the same clip resubmitted under
different accounts or localities, plus flags for capture-time/GPS mismatch and
recycled footage from earlier elections.

**Why it matters.** One recycled video published as current discredits an entire
observation network. The SHA-256 hash already detects alteration after upload; this
catches the harder case — footage that was never what it claimed to be.

**Effort.** Medium. Perceptual hash at capture, similarity index server-side, and a
review affordance in the queue.

---

## 6. Full localisation: Hausa, Yoruba, Igbo and Nigerian Pidgin

**What.** Translate the interface, the training curriculum and the assessments.
Profiles already record a language preference; nothing reads it yet.

**Why it matters.** Restricting participation to confident English readers excludes
a large share of the country, disproportionately in the areas where independent
observation is most valuable. The curriculum in particular has to be understood,
not just displayed.

**Effort.** High — mostly translation and review, not engineering. Needs native
reviewers per language, especially for legal terminology.

---

## 7. Locality alert subscriptions

**What.** Let anyone follow a state, LGA or specific polling unit and receive a
push or email alert when verified evidence is published there. Web Push for PWA
installs; email as the fallback.

**Why it matters.** Turns passive viewers into a distributed early-warning
network, and gives people a reason to keep the app installed between elections.
The `notifications` table and profile notify flags already exist.

**Effort.** Low-medium. Web Push subscriptions, a fan-out worker, and a
preferences screen.

---

## 8. Public evidence archive with permanent citations

**What.** A searchable, permanent record of every published report and feed, each
with a stable citation URL, filterable by election, state, LGA, category and date.

**Why it matters.** Disputes are litigated for months after the count. Evidence
that is only visible on election day cannot be used in a tribunal or a follow-up
investigation. A stable citation is also what makes journalists and researchers
link to DIGITs rather than re-host clips.

**Effort.** Medium. Retention policy, search index, and a decision about how long
released evidence stays public.

---

## 9. Result-sheet OCR with cross-check against observer figures

**What.** Extract the figures from a photographed Form EC8A automatically and
compare them against what the observer typed and against the IReV upload for the
same unit. Flag mismatches for review.

**Why it matters.** Transcription error and deliberate alteration look identical in
a spreadsheet; two independent readings of the same sheet distinguish them. This is
where a lot of quiet result manipulation is detectable.

**Effort.** High. OCR accuracy on phone photographs of carbon-copy forms is the
hard part — needs a human-in-the-loop confirmation step, never automatic
publication.

---

## 10. Command Center hardening for election-day load

**What.** Rate limiting and abuse controls beyond the current comment limit, an
operator handover log with shift boundaries, per-state operator scoping so one
console is not triaging all 36 states, and a load-shedding mode that degrades the
grid gracefully instead of failing.

**Why it matters.** Everything on the platform is built for the one day a year when
traffic is 100× normal and the incentive to disrupt it is highest. A Command Center
that stalls at 14:00 on election day is worse than no Command Center, because
observers in the field are relying on it.

**Effort.** Medium. Mostly operational: load testing, queue partitioning by
locality, and an explicit degradation path.

---

## Two things worth doing before any of the above

**Verify the LGA reference data.** `src/lib/nigeria.ts` carries all 774 LGAs from a
standard listing. Check it against INEC's current official register before it is
used for deployment planning — a wrong LGA name in a deployment record is a real
operational error.

**Commission an independent security review.** The platform now holds NINs, precise
coordinates and video of identifiable people. Row-level security is enforced on
every table and evidence is served only through signed URLs, but a system carrying
this data should be reviewed by someone who did not build it.
