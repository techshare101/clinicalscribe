/**
 * 🔥 ClinicalScribe Demo Data Seeder
 * 
 * Seeds realistic clinical data for CIO demos:
 * - 5 diverse patients with demographics
 * - 3 SOAP notes per patient (15 total)
 * - Digital signatures + PDF flags
 * - Realistic medical content + timestamps
 * 
 * Usage: npx tsx scripts/seed-demo.ts
 */

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, collection, serverTimestamp, deleteDoc, getDocs } from "firebase/firestore";
import { faker } from "@faker-js/faker";

// Import Firebase config from existing setup
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const MESSAGING_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

const firebaseConfig = {
  apiKey: API_KEY!,
  authDomain: AUTH_DOMAIN!,
  projectId: PROJECT_ID!,
  storageBucket: STORAGE_BUCKET!,
  messagingSenderId: MESSAGING_SENDER_ID!,
  appId: APP_ID!,
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

// Realistic medical scenarios for SOAP notes
const medicalScenarios = [
  {
    subjective: "Patient reports chest pain radiating to left arm, onset 2 hours ago. Describes pain as crushing, 8/10 severity. Associated with shortness of breath and diaphoresis. No recent trauma or exercise.",
    objective: "Vital signs: BP 160/95, HR 102, RR 22, O2 sat 95% on room air. Patient appears anxious and diaphoretic. Heart sounds regular, no murmurs. Lungs clear bilaterally. No extremity edema.",
    assessment: "Acute chest pain, rule out myocardial infarction. Hypertensive. Anxiety secondary to chest pain symptoms.",
    plan: "Obtain 12-lead EKG, chest X-ray, and cardiac enzymes. Start oxygen therapy. Administer aspirin 325mg PO. Monitor on telemetry. Cardiology consultation if abnormal findings."
  },
  {
    subjective: "Patient presents with 3-day history of fever, chills, and productive cough with yellow-green sputum. Reports fatigue and decreased appetite. No recent travel or sick contacts.",
    objective: "Temp 101.2°F, BP 125/78, HR 88, RR 20, O2 sat 97%. Alert and oriented. Lungs with coarse crackles in right lower lobe. No use of accessory muscles. Heart rate regular.",
    assessment: "Community-acquired pneumonia, right lower lobe. Mild dehydration.",
    plan: "Chest X-ray to confirm pneumonia. CBC with differential, BMP. Start azithromycin 500mg daily x 5 days. Increase fluid intake. Follow-up in 48-72 hours if not improving."
  },
  {
    subjective: "Patient reports persistent headache for 5 days, worsening this morning. Describes as throbbing, bilateral, 7/10 intensity. Associated with photophobia and mild nausea. No recent head trauma.",
    objective: "Vital signs stable. Neurological exam normal, PERRL, no focal deficits. Neck supple, no meningeal signs. Fundoscopic exam normal. No papilledema.",
    assessment: "Tension-type headache vs. migraine without aura. No signs of secondary headache.",
    plan: "Trial of ibuprofen 600mg TID with food. Recommend sleep hygiene and stress management. Return if symptoms worsen or persist beyond 1 week. Consider neurology referral if recurrent."
  },
  {
    subjective: "Patient presents for routine follow-up of type 2 diabetes. Reports good adherence to metformin. Checking blood sugars 2x daily, averaging 140-160 mg/dL. No polyuria, polydipsia, or vision changes.",
    objective: "Vital signs: BP 130/82, BMI 31.2. Well-appearing. Feet exam shows no ulcers or calluses. Sensation intact to monofilament testing. Retinal exam deferred to ophthalmology.",
    assessment: "Type 2 diabetes mellitus, well controlled on metformin. Hypertension, well controlled.",
    plan: "Continue metformin 1000mg BID. Order HbA1c, lipid panel, microalbumin. Diabetic education reinforcement. Return in 3 months. Ophthalmology follow-up due."
  },
  {
    subjective: "Patient reports 2-week history of lower back pain after lifting heavy boxes. Pain is constant, aching, 6/10, worse with movement. No radiation to legs. No bowel/bladder dysfunction.",
    objective: "Vital signs normal. Gait normal. Lumbar spine with paraspinal muscle tenderness. Range of motion limited by pain. Straight leg raise negative bilaterally. No neurological deficits.",
    assessment: "Acute lumbar strain, mechanical low back pain. No red flags for serious pathology.",
    plan: "NSAIDs for inflammation and pain control. Physical therapy referral. Activity modification, avoid heavy lifting. Heat/ice therapy. Follow-up in 2 weeks if not improving."
  }
];

const doctors = [
  "Dr. Sarah Mitchell, MD",
  "Dr. James Rodriguez, MD", 
  "Dr. Emily Chen, MD",
  "Dr. Michael Thompson, MD",
  "Dr. Lisa Williams, MD"
];

const encounterTypes = [
  "Emergency Department Visit",
  "Urgent Care Visit", 
  "Primary Care Follow-up",
  "Annual Physical Exam",
  "Specialist Consultation"
];

async function clearExistingData() {
  console.log("🧹 Clearing existing demo data...");
  
  try {
    // Clear patients
    const patientsSnapshot = await getDocs(collection(db, "patients"));
    for (const doc of patientsSnapshot.docs) {
      await deleteDoc(doc.ref);
    }
    
    // Clear SOAP notes  
    const soapSnapshot = await getDocs(collection(db, "soapNotes"));
    for (const doc of soapSnapshot.docs) {
      await deleteDoc(doc.ref);
    }
    
    console.log("✅ Existing demo data cleared");
  } catch (error) {
    console.warn("⚠️ Could not clear existing data:", error.message);
  }
}

async function seedDemoData() {
  console.log("🔥 Starting ClinicalScribe demo data seeding...");
  
  await clearExistingData();
  
  const patients = [];
  
  // Create 5 diverse patients
  for (let i = 0; i < 5; i++) {
    const patientId = faker.string.uuid();
    const gender = faker.helpers.arrayElement(['male', 'female', 'other']);
    const age = faker.number.int({ min: 25, max: 85 });
    
    const patient = {
      id: patientId,
      name: faker.person.fullName({ sex: gender === 'other' ? 'male' : gender }),
      dob: faker.date.birthdate({ min: age, max: age, mode: 'age' }),
      gender: gender,
      mrn: `MRN${faker.string.numeric(7)}`,
      phone: faker.phone.number(),
      email: faker.internet.email(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zip: faker.location.zipCode()
      },
      emergencyContact: {
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        relationship: faker.helpers.arrayElement(['spouse', 'child', 'parent', 'sibling', 'friend'])
      },
      insurance: {
        provider: faker.helpers.arrayElement(['Blue Cross', 'Aetna', 'Cigna', 'UnitedHealth', 'Medicare']),
        policyNumber: faker.string.alphanumeric(10, { casing: 'upper' })
      },
      allergies: faker.helpers.arrayElements(['NKDA', 'Penicillin', 'Shellfish', 'Latex', 'Sulfa'], { min: 1, max: 2 }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    patients.push(patient);
    
    // Save patient to Firestore
    await setDoc(doc(db, "patients", patientId), patient);
    console.log(`✅ Patient ${i + 1}/5 created: ${patient.name} (${patient.mrn})`);
  }
  
  // Create 3 SOAP notes per patient (15 total)
  let totalNotes = 0;
  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    
    for (let j = 0; j < 3; j++) {
      const scenario = faker.helpers.arrayElement(medicalScenarios);
      const doctor = faker.helpers.arrayElement(doctors);
      const encounterType = faker.helpers.arrayElement(encounterTypes);
      const createdDate = faker.date.recent({ days: 30 });
      
      const soapNoteId = faker.string.uuid();
      const uid = `demo-user-${faker.string.alphanumeric(8)}`;
      
      const soapNote = {
        id: soapNoteId,
        uid: uid,
        patientId: patient.id,
        patientName: patient.name,
        patientMrn: patient.mrn,
        
        // SOAP content
        subjective: scenario.subjective,
        objective: scenario.objective,
        assessment: scenario.assessment,
        plan: scenario.plan,
        
        // Clinical metadata
        encounterType: encounterType,
        chiefComplaint: faker.helpers.arrayElement([
          'Chest pain', 'Shortness of breath', 'Headache', 
          'Abdominal pain', 'Back pain', 'Fever', 'Cough',
          'Diabetes follow-up', 'Hypertension management'
        ]),
        painLevel: faker.helpers.arrayElement(['0/10', '2/10', '4/10', '6/10', '8/10', '10/10']),
        
        // AI and flags
        aiSuggested: faker.datatype.boolean(0.7),
        redFlag: faker.datatype.boolean(0.2),
        
        // Digital signature and PDF metadata
        digitalSignature: `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50"><text x="10" y="30" font-family="cursive" font-size="18">✍️ ' + doctor + '</text></svg>')}`,
        doctorName: doctor,
        signedAt: serverTimestamp(),
        signedBy: doctor,
        
        // PDF metadata  
        storagePath: `pdfs/demo/${uid}/${soapNoteId}.pdf`,
        pdf: {
          status: 'generated',
          path: `pdfs/demo/${uid}/${soapNoteId}.pdf`,
          generatedAt: createdDate.toISOString(),
          watermark: 'ClinicalScribe Beta'
        },
        
        // FHIR export metadata
        fhirExport: {
          status: faker.helpers.arrayElement(['none', 'pending', 'exported', 'failed']),
          exportedAt: faker.datatype.boolean(0.3) ? createdDate.toISOString() : null,
          documentReference: faker.datatype.boolean(0.3) ? `DocumentReference/${faker.string.uuid()}` : null
        },
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Save SOAP note to Firestore
      await setDoc(doc(db, "soapNotes", soapNoteId), soapNote);
      totalNotes++;
      console.log(`   ➡️ SOAP note ${j + 1}/3 for ${patient.name}: ${encounterType}`);
    }
  }
  
  console.log(`\n🎯 Demo data seeding complete!`);
  console.log(`📊 Summary:`);
  console.log(`   👥 Patients: 5`);
  console.log(`   📋 SOAP Notes: ${totalNotes}`);
  console.log(`   ✍️ Digital Signatures: ${totalNotes}`);
  console.log(`   📄 PDF Files: ${totalNotes}`);
  console.log(`\n🚀 Ready for CIO demo! Check Dashboard and SOAP History.`);
}

// Execute the seeding
seedDemoData()
  .then(() => {
    console.log("✅ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });