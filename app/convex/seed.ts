import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

const APCM_ELEMENTS = [
  { id: 1, name: "Patient consent" },
  { id: 2, name: "Initiating visit (if new)" },
  { id: 3, name: "Comprehensive care plan" },
  { id: 4, name: "24/7 access for urgent needs" },
  { id: 5, name: "Continuity of care with designated team member" },
  { id: 6, name: "Comprehensive care management" },
  { id: 7, name: "Transitional care management" },
  { id: 8, name: "Coordination of home + community services" },
  { id: 9, name: "Enhanced communication (asynchronous and synchronous)" },
  { id: 10, name: "Patient population-level management" },
  { id: 11, name: "Performance measurement" },
];

const FIRST_NAMES_F = ["Maria","Linda","Patricia","Barbara","Susan","Margaret","Dorothy","Helen","Sandra","Carol","Ruth","Sharon","Cynthia","Kathleen","Frances","Joyce","Diane","Virginia","Anne","Brenda","Pamela","Nancy","Lois","Donna","Carolyn"];
const FIRST_NAMES_M = ["Robert","James","John","William","Richard","Charles","Thomas","Donald","George","Kenneth","Edward","Ronald","Frank","Larry","Steven","Walter","Harold","Eugene","Albert","Wayne","Ralph","Roy","Russell","Stanley","Howard"];
const LAST_NAMES = ["Rodriguez","Garcia","Martinez","Hernandez","Lopez","Gonzalez","Perez","Sanchez","Ramirez","Torres","Smith","Johnson","Williams","Brown","Jones","Davis","Miller","Wilson","Moore","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Walker","Young","Allen","King","Wright","Scott","Green","Adams","Baker","Nelson"];
const CONDITIONS_POOL = [
  "Type 2 Diabetes Mellitus",
  "Essential Hypertension",
  "Congestive Heart Failure",
  "Chronic Obstructive Pulmonary Disease",
  "Chronic Kidney Disease Stage 3",
  "Atrial Fibrillation",
  "Hyperlipidemia",
  "Major Depressive Disorder",
  "Generalized Anxiety Disorder",
  "Osteoarthritis",
  "Coronary Artery Disease",
  "Asthma",
  "Hypothyroidism",
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function makeMedicareId(): string {
  const letters = "ABCDEFGHJKMNPQRTUVWXY";
  const digits = "0123456789";
  return `${rand(digits.split(""))}${rand(letters.split(""))}${rand(digits.split(""))}${rand(letters.split(""))}${rand(letters.split(""))}${rand(digits.split(""))}${rand(digits.split(""))}${rand(digits.split(""))}${rand(letters.split(""))}${rand(digits.split(""))}${rand(digits.split(""))}`;
}

function dobFromAge(age: number): string {
  const year = new Date().getUTCFullYear() - age;
  const month = randInt(1, 12);
  const day = randInt(1, 28);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const STATES = ["NJ","NY","PA","CT","MA","FL","CA","TX","IL","OH","GA","NC"];

export const seed = action({
  args: { reset: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<{ ok: boolean; nurseId: Id<"users">; mariaId: Id<"patients">; patientCount: number }> => {
    if (args.reset) {
      await ctx.runMutation(internal.seed._internalWipe, {});
    }

    // Create practice
    const practiceId: Id<"practices"> = await ctx.runMutation(internal.seed._internalCreatePractice, {
      name: "Foresight Demo Clinic",
      timezone: "America/New_York",
    });

    // Create nurse Sarah Chen (Convex Auth password-less seed user, we create the row directly)
    const nurseId: Id<"users"> = await ctx.runMutation(internal.seed._internalCreateUser, {
      name: "Sarah Chen, RN",
      email: "sarah@foresight.demo",
      role: "nurse",
      practiceId,
      status: "active",
    });

    // Maria Rodriguez: the showcase patient
    const mariaId: Id<"patients"> = await ctx.runMutation(internal.seed._internalCreatePatient, {
      medicareId: makeMedicareId(),
      firstName: "Maria",
      lastName: "Rodriguez",
      dateOfBirth: dobFromAge(72),
      gender: "F",
      addressLine1: "423 Park Avenue",
      city: "Newark",
      state: "NJ",
      zip: "07102",
      phone: "(973) 555-0142",
      email: "maria.rodriguez@example.com",
      dualEligible: false,
      qmbStatus: false,
      supplementalInsurance: "medigap",
      chronicConditions: [
        "Type 2 Diabetes Mellitus",
        "Essential Hypertension",
        "Congestive Heart Failure",
        "Chronic Kidney Disease Stage 3",
      ],
      tier: "level_2",
      billingProgram: "apcm",
      riskScore: 78,
      primaryNurseId: nurseId,
      practiceId,
      enrolledDaysAgo: 240,
      lastTouchedDaysAgo: 22,
    });

    // Generate 49 more patients
    const patientIds: Id<"patients">[] = [mariaId];
    for (let i = 0; i < 49; i++) {
      const isF = Math.random() > 0.45;
      const age = randInt(66, 89);
      const conditions = pickN(CONDITIONS_POOL, randInt(2, 5));
      const tier = randInt(1, 100) < 30 ? "level_3" : randInt(1, 100) < 70 ? "level_2" : "level_1";
      const billingProgram = randInt(1, 100) < 50 ? "apcm" : randInt(1, 100) < 50 ? "ccm" : "pcm";
      const riskScore = tier === "level_3" ? randInt(70, 95) : tier === "level_2" ? randInt(45, 80) : randInt(20, 55);
      const lastTouchedDaysAgo = randInt(1, 60);
      const pid: Id<"patients"> = await ctx.runMutation(internal.seed._internalCreatePatient, {
        medicareId: makeMedicareId(),
        firstName: rand(isF ? FIRST_NAMES_F : FIRST_NAMES_M),
        lastName: rand(LAST_NAMES),
        dateOfBirth: dobFromAge(age),
        gender: isF ? "F" : "M",
        addressLine1: `${randInt(100, 999)} ${rand(["Maple","Oak","Pine","Cedar","Elm","Birch"])} ${rand(["St","Ave","Rd","Ln","Blvd"])}`,
        city: rand(["Newark","Jersey City","Trenton","Paterson","Hoboken","Princeton","Edison"]),
        state: "NJ",
        zip: `0${randInt(7000, 8999)}`,
        phone: `(973) 555-${String(randInt(0, 9999)).padStart(4, "0")}`,
        email: undefined,
        dualEligible: Math.random() > 0.7,
        qmbStatus: Math.random() > 0.8,
        supplementalInsurance: rand(["medigap","medicare_advantage","none","medicaid_only"]) as any,
        chronicConditions: conditions,
        tier: tier as any,
        billingProgram: billingProgram as any,
        riskScore,
        primaryNurseId: nurseId,
        practiceId,
        enrolledDaysAgo: randInt(30, 540),
        lastTouchedDaysAgo,
      });
      patientIds.push(pid);
    }

    // Generate encounter history (~3-8 per patient over last 90 days), care plans, service elements
    const now = Date.now();
    const month = new Date(now).toISOString().slice(0, 7);

    for (const pid of patientIds) {
      // Care plan
      await ctx.runMutation(internal.seed._internalCreateCarePlanWithVersions, {
        patientId: pid,
        nurseId,
        versionsCount: pid === mariaId ? 4 : randInt(1, 3),
      });

      // Encounters
      const nEncounters = pid === mariaId ? 8 : randInt(2, 6);
      for (let i = 0; i < nEncounters; i++) {
        await ctx.runMutation(internal.seed._internalCreateEncounter, {
          patientId: pid,
          nurseId,
          daysAgo: randInt(1, 90),
          durationSeconds: randInt(8 * 60, 28 * 60),
        });
      }

      // Service elements (APCM only)
      const patient: any = await ctx.runQuery(internal.seed._internalGetPatient, { patientId: pid });
      if (patient && patient.billingProgram === "apcm") {
        const deliveredCount =
          pid === mariaId ? 9 : randInt(4, 11);
        for (let i = 0; i < APCM_ELEMENTS.length; i++) {
          const el = APCM_ELEMENTS[i];
          const status =
            i < deliveredCount ? "delivered" : i < deliveredCount + 1 ? "available" : "not_yet";
          await ctx.runMutation(internal.seed._internalCreateServiceElement, {
            patientId: pid,
            month,
            elementId: el.id,
            elementName: el.name,
            status: status as any,
          });
        }
      }

      // Billing record (current month)
      await ctx.runMutation(internal.seed._internalCreateBillingRecord, {
        patientId: pid,
        primaryNurseId: nurseId,
        practiceId,
        month,
      });
    }

    // Maria-specific: a hospital event 2 weeks ago + portal message
    await ctx.runMutation(internal.seed._internalCreateHospitalEvent, {
      patientId: mariaId,
      eventType: "admission",
      facility: "Newark Beth Israel Medical Center",
      eventDate: now - 14 * 24 * 60 * 60 * 1000,
      reason: "CHF exacerbation, fluid overload",
    });
    await ctx.runMutation(internal.seed._internalCreateHospitalEvent, {
      patientId: mariaId,
      eventType: "discharge",
      facility: "Newark Beth Israel Medical Center",
      eventDate: now - 11 * 24 * 60 * 60 * 1000,
      reason: "Stable, follow-up CHF management",
    });

    return { ok: true, nurseId, mariaId, patientCount: patientIds.length };
  },
});

import { internalMutation, internalQuery } from "./_generated/server";

export const _internalWipe = internalMutation({
  args: { fullAuthReset: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const tables = [
      "patients","carePlans","carePlanVersions","encounters","soapNotes",
      "transcripts","agentThreads","agentMessages","agentBriefings","notifications",
      "medicalDocuments","timeLogs","billingRecords","serviceElements",
      "portalMessages","outreachAttempts","hospitalEvents","practices",
    ] as const;
    for (const t of tables) {
      const rows = await ctx.db.query(t as any).collect();
      for (const r of rows) await ctx.db.delete(r._id);
    }

    if (args.fullAuthReset) {
      // Nuclear: clear every user row AND the auth-provider tables so a
      // stuck demo session can recover. Run only via the public resetDemo
      // action below.
      const authTables = [
        "authAccounts","authSessions","authRefreshTokens","authVerifiers",
        "authVerificationCodes","authRateLimits",
      ] as const;
      for (const t of authTables) {
        try {
          const rows = await ctx.db.query(t as any).collect();
          for (const r of rows) await ctx.db.delete(r._id);
        } catch {
          // Table may not exist on this Convex Auth version; ignore.
        }
      }
      const users = await ctx.db.query("users").collect();
      for (const u of users) await ctx.db.delete(u._id);
    } else {
      // Default: drop only role-bearing seed rows; leave auth-provider users.
      const users = await ctx.db.query("users").collect();
      for (const u of users) {
        if (u.role === "nurse" || u.role === "patient" || u.role === "admin") {
          await ctx.db.delete(u._id);
        }
      }
    }
  },
});

/**
 * Public demo reset. Wipes everything (including the auth-provider tables),
 * then reseeds via the main `seed` action. Intended for the "Reset demo"
 * button on the login screen so a stuck session can recover without auth.
 */
export const resetDemo = action({
  args: {},
  handler: async (ctx): Promise<{ ok: boolean }> => {
    await ctx.runMutation(internal.seed._internalWipe, { fullAuthReset: true });
    await ctx.runAction(api.seed.seed, { reset: false });
    return { ok: true };
  },
});

export const _internalCreatePractice = internalMutation({
  args: { name: v.string(), timezone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("practices", args);
  },
});

export const _internalCreateUser = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("nurse"), v.literal("physician"), v.literal("admin"), v.literal("patient")),
    practiceId: v.id("practices"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      ...args,
      email: args.email.toLowerCase().trim(),
    });
  },
});

export const _internalCreatePatient = internalMutation({
  args: {
    medicareId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    gender: v.union(v.literal("M"), v.literal("F"), v.literal("X")),
    addressLine1: v.string(),
    city: v.string(),
    state: v.string(),
    zip: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    dualEligible: v.boolean(),
    qmbStatus: v.boolean(),
    supplementalInsurance: v.union(
      v.literal("medigap"),
      v.literal("medicare_advantage"),
      v.literal("medicaid_only"),
      v.literal("none"),
    ),
    chronicConditions: v.array(v.string()),
    tier: v.union(v.literal("level_1"), v.literal("level_2"), v.literal("level_3")),
    billingProgram: v.union(v.literal("ccm"), v.literal("pcm"), v.literal("apcm")),
    riskScore: v.number(),
    primaryNurseId: v.id("users"),
    practiceId: v.id("practices"),
    enrolledDaysAgo: v.number(),
    lastTouchedDaysAgo: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const enrolledAt = now - args.enrolledDaysAgo * 24 * 60 * 60 * 1000;
    const lastTouchedAt = now - args.lastTouchedDaysAgo * 24 * 60 * 60 * 1000;
    const { enrolledDaysAgo, lastTouchedDaysAgo, ...rest } = args;
    return await ctx.db.insert("patients", {
      ...rest,
      enrolledAt,
      consentObtainedAt: enrolledAt,
      consentObtainedBy: args.primaryNurseId,
      lastTouchedAt,
      riskScoreUpdatedAt: now,
      status: "active",
    });
  },
});

export const _internalCreateCarePlanWithVersions = internalMutation({
  args: {
    patientId: v.id("patients"),
    nurseId: v.id("users"),
    versionsCount: v.number(),
  },
  handler: async (ctx, args) => {
    const carePlanId = await ctx.db.insert("carePlans", {
      patientId: args.patientId,
      createdBy: args.nurseId,
    });
    const patient = await ctx.db.get(args.patientId);
    if (!patient) return;

    const baseContent = {
      problemList: patient.chronicConditions,
      expectedOutcomes: [
        "Maintain HbA1c below 7.5%",
        "Blood pressure under 140/90",
        "No avoidable ER visits",
        "Medication adherence above 85%",
      ],
      treatmentGoals: [
        "Weekly weight checks",
        "Daily glucose log",
        "Quarterly labs",
      ],
      symptomManagement: [
        "Call clinic for chest pain, severe SOB, weight gain >3lb in 2 days",
        "Patient instructed on sliding scale insulin",
      ],
      plannedInterventions: [
        "Monthly nurse call",
        "Quarterly endocrinology follow-up",
        "Annual eye and foot exam",
      ],
      medicationManagement: [
        "Metformin 1000mg BID",
        "Lisinopril 20mg daily",
        "Atorvastatin 40mg QHS",
        "Furosemide 40mg daily",
      ],
      communityResources: [
        "Meals on Wheels enrolled",
        "Pharmacy delivery via local CVS",
      ],
      providerCoordination: [
        "PCP: Dr. Patel, monthly",
        "Cardiology: Dr. Singh, quarterly",
        "Endocrinology: Dr. Lee, quarterly",
      ],
      reviewSchedule: "Reviewed monthly during nurse call; full review every 90 days",
    };

    let lastVersionId: Id<"carePlanVersions"> | null = null;
    const now = Date.now();
    for (let v = 1; v <= args.versionsCount; v++) {
      const ageDays = (args.versionsCount - v + 1) * 30;
      const draftedAt = now - ageDays * 24 * 60 * 60 * 1000;
      const content =
        v === 1
          ? baseContent
          : {
              ...baseContent,
              plannedInterventions:
                v >= 3
                  ? [...baseContent.plannedInterventions, "Home BP monitor added"]
                  : baseContent.plannedInterventions,
              medicationManagement:
                v >= 4
                  ? [
                      ...baseContent.medicationManagement.slice(0, 3),
                      "Furosemide increased to 60mg daily",
                      "Spironolactone 25mg daily added (cardiology)",
                    ]
                  : baseContent.medicationManagement,
            };
      const id = await ctx.db.insert("carePlanVersions", {
        carePlanId,
        patientId: args.patientId,
        versionNumber: v,
        content,
        diffSummary:
          v === 1
            ? "Initial care plan"
            : v >= 4
              ? "Furosemide titration after CHF admission; spironolactone added"
              : v >= 3
                ? "Home BP monitor added to interventions"
                : "Minor edits",
        rationale:
          v === 1
            ? "Initial plan after enrollment"
            : "Updated after monthly review and recent encounters",
        draftedAt,
        draftedBy: args.nurseId,
        draftSource: "manual",
        reviewStatus: "approved",
        approvedAt: draftedAt,
        approvedBy: args.nurseId,
      });
      lastVersionId = id;
    }
    if (lastVersionId) {
      await ctx.db.patch(carePlanId, { currentVersionId: lastVersionId });
    }
  },
});

export const _internalCreateEncounter = internalMutation({
  args: {
    patientId: v.id("patients"),
    nurseId: v.id("users"),
    daysAgo: v.number(),
    durationSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startedAt = now - args.daysAgo * 24 * 60 * 60 * 1000;
    const id = await ctx.db.insert("encounters", {
      patientId: args.patientId,
      nurseId: args.nurseId,
      type: "phone_call",
      direction: "outbound",
      startedAt,
      endedAt: startedAt + args.durationSeconds * 1000,
      durationSeconds: args.durationSeconds,
      status: "completed",
      topicTags: [rand(["refill","lab_followup","symptom_check","care_plan_review"]) as any],
      serviceElementsTouched: [],
    });
    // Create a signed SOAP note for it
    await ctx.db.insert("soapNotes", {
      patientId: args.patientId,
      encounterId: id,
      nurseId: args.nurseId,
      subjective: "Patient reports stable symptoms. No new complaints.",
      objective: "Vital signs reported as within normal limits.",
      assessment: "Stable on current regimen.",
      plan: "Continue current plan. Next call in 30 days.",
      status: "signed",
      draftSource: "ai_from_transcript",
      aiConfidenceScore: 88,
      signedAt: startedAt + args.durationSeconds * 1000 + 300_000,
      signedBy: args.nurseId,
      draftedAt: startedAt + args.durationSeconds * 1000 + 60_000,
    });
    // Create a time log
    const month = new Date(startedAt).toISOString().slice(0, 7);
    await ctx.db.insert("timeLogs", {
      patientId: args.patientId,
      nurseId: args.nurseId,
      encounterId: id,
      startTimestamp: startedAt,
      endTimestamp: startedAt + args.durationSeconds * 1000,
      durationSeconds: args.durationSeconds,
      activityType: "phone_call",
      activityDescription: "Monthly care management call",
      billable: true,
      month,
    });
    return id;
  },
});

export const _internalCreateServiceElement = internalMutation({
  args: {
    patientId: v.id("patients"),
    month: v.string(),
    elementId: v.number(),
    elementName: v.string(),
    status: v.union(v.literal("not_yet"), v.literal("available"), v.literal("delivered")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("serviceElements", { ...args, evidence: [] });
  },
});

export const _internalCreateBillingRecord = internalMutation({
  args: {
    patientId: v.id("patients"),
    primaryNurseId: v.id("users"),
    practiceId: v.id("practices"),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId);
    if (!patient) return;
    const program = patient.billingProgram;
    let billingCodes: string[] = [];
    let reimbursementCents = 0;
    let patientCostShareCents = 0;
    if (program === "ccm") {
      billingCodes = ["99490"];
      reimbursementCents = 6422;
      patientCostShareCents = 1284;
    } else if (program === "pcm") {
      billingCodes = ["99424"];
      reimbursementCents = 8311;
      patientCostShareCents = 1662;
    } else {
      // APCM tier-based
      const code = patient.tier === "level_3" ? "G0558" : patient.tier === "level_2" ? "G0557" : "G0556";
      billingCodes = [code];
      reimbursementCents = patient.tier === "level_3" ? 11000 : patient.tier === "level_2" ? 7200 : 1500;
      patientCostShareCents = Math.floor(reimbursementCents * 0.2);
    }
    return await ctx.db.insert("billingRecords", {
      patientId: args.patientId,
      primaryNurseId: args.primaryNurseId,
      practiceId: args.practiceId,
      month: args.month,
      billingProgram: program,
      billingCodes,
      reimbursementCents,
      patientCostShareCents,
      status: "draft",
    });
  },
});

export const _internalCreateHospitalEvent = internalMutation({
  args: {
    patientId: v.id("patients"),
    eventType: v.union(v.literal("admission"), v.literal("discharge"), v.literal("transfer")),
    facility: v.string(),
    eventDate: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("hospitalEvents", {
      ...args,
      notified: true,
      notifiedAt: args.eventDate,
    });
  },
});

export const _internalGetPatient = internalQuery({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.patientId);
  },
});
